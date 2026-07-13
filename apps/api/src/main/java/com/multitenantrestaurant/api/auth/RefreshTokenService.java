package com.multitenantrestaurant.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.multitenantrestaurant.api.common.exception.ApiException;
import com.multitenantrestaurant.api.config.JwtProperties;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository repository;
    private final RefreshTokenFamilyRepository familyRepository;
    private final JwtProperties props;

    @Transactional
    public IssuedToken issue(UUID userId, UUID selectedTenantUserId) {
        Instant now = Instant.now();
        RefreshTokenFamily family = new RefreshTokenFamily();
        family.setUserId(userId);
        family.setExpiresAt(now.plus(props.refreshTokenExpiryDays(), ChronoUnit.DAYS));
        family = familyRepository.save(family);

        return issue(userId, selectedTenantUserId, family);
    }

    private IssuedToken issue(
        UUID userId,
        UUID selectedTenantUserId,
        RefreshTokenFamily family
    ) {
        String rawToken = generateRawToken();
        RefreshToken entity = new RefreshToken();
        entity.setUserId(userId);
        entity.setSelectedTenantUserId(selectedTenantUserId);
        entity.setFamilyId(family.getId());
        entity.setTokenHash(hash(rawToken));
        entity.setExpiresAt(family.getExpiresAt());
        RefreshToken saved = repository.save(entity);

        return new IssuedToken(
            rawToken,
            family.getId(),
            saved.getId(),
            family.getExpiresAt()
        );
    }

    @Transactional(noRollbackFor = RefreshTokenReuseException.class)
    public RefreshResult rotate(String rawToken) {
        return rotate(rawToken, null, null, false);
    }

    @Transactional(noRollbackFor = RefreshTokenReuseException.class)
    public RefreshResult rotateAndSelect(
        String rawToken,
        UUID expectedUserId,
        UUID selectedTenantUserId
    ) {
        return rotate(rawToken, expectedUserId, selectedTenantUserId, true);
    }

    @Transactional
    public void revokeFamily(String rawToken) {
        String tokenHash = hash(rawToken);
        UUID familyId = repository.findFamilyIdByTokenHash(tokenHash).orElse(null);

        if (familyId == null) {
            return;
        }

        RefreshTokenFamily family = familyRepository.findByIdForUpdate(familyId).orElse(null);

        if (family == null || family.getRevokedAt() != null) {
            return;
        }

        revokeFamilyLocked(family, Instant.now());
    }

    void clearSelection(UUID tokenId) {
        RefreshToken token = repository.findById(tokenId)
            .orElseThrow(this::invalidRefreshToken);
        token.setSelectedTenantUserId(null);
        repository.save(token);
    }

    private RefreshResult rotate(
        String rawToken,
        UUID expectedUserId,
        UUID selectedTenantUserId,
        boolean replaceSelection
    ) {
        Instant requestStartedAt = Instant.now();
        String tokenHash = hash(rawToken);
        UUID familyId = repository.findFamilyIdByTokenHash(tokenHash)
            .orElseThrow(this::invalidRefreshToken);
        RefreshTokenFamily family = familyRepository.findByIdForUpdate(familyId)
            .orElseThrow(this::invalidRefreshToken);
        Instant now = Instant.now();

        if (family.getRevokedAt() != null) {
            throw invalidRefreshToken();
        }
        if (expectedUserId != null && !expectedUserId.equals(family.getUserId())) {
            throw invalidRefreshToken();
        }
        if (!family.getExpiresAt().isAfter(now)) {
            throw refreshTokenExpired();
        }

        RefreshToken existing = repository.findByTokenHash(tokenHash)
            .filter(token -> token.getFamilyId().equals(family.getId()))
            .filter(token -> token.getUserId().equals(family.getUserId()))
            .orElseThrow(this::invalidRefreshToken);

        if (existing.getRevokedAt() != null) {
            if (isConcurrentRotation(existing, requestStartedAt)) {
                throw new RefreshTokenAlreadyRotatedException();
            }

            if (existing.getRotatedAt() == null) {
                throw invalidRefreshToken();
            }

            revokeFamilyLocked(family, now);
            throw new RefreshTokenReuseException();
        }
        if (!existing.getExpiresAt().isAfter(now)) {
            throw refreshTokenExpired();
        }

        existing.setRevokedAt(now);
        existing.setRotatedAt(now);
        repository.save(existing);

        UUID nextSelection = replaceSelection
            ? selectedTenantUserId
            : existing.getSelectedTenantUserId();
        IssuedToken next = issue(existing.getUserId(), nextSelection, family);

        return new RefreshResult(
            existing.getUserId(),
            nextSelection,
            next.rawToken(),
            next.tokenId(),
            next.expiresAt()
        );
    }

    private void revokeFamilyLocked(RefreshTokenFamily family, Instant revokedAt) {
        family.setRevokedAt(revokedAt);
        familyRepository.save(family);
        repository.revokeFamily(family.getId(), revokedAt);
    }

    private boolean isConcurrentRotation(RefreshToken token, Instant requestStartedAt) {
        if (token.getRotatedAt() == null) {
            return false;
        }

        Instant graceEndsAt = token.getRotatedAt()
            .plus(props.refreshTokenConcurrencyGraceSeconds(), ChronoUnit.SECONDS);
        return requestStartedAt.isBefore(graceEndsAt);
    }

    private ApiException invalidRefreshToken() {
        return new ApiException(
            "INVALID_REFRESH_TOKEN",
            HttpStatus.UNAUTHORIZED,
            "Invalid refresh token"
        );
    }

    private ApiException refreshTokenExpired() {
        return new ApiException(
            "REFRESH_TOKEN_EXPIRED",
            HttpStatus.UNAUTHORIZED,
            "Refresh token expired"
        );
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(
                digest.digest(rawToken.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public record IssuedToken(
        String rawToken,
        UUID familyId,
        UUID tokenId,
        Instant expiresAt
    ) {}

    public record RefreshResult(
        UUID userId,
        UUID selectedTenantUserId,
        String rawToken,
        UUID tokenId,
        Instant expiresAt
    ) {}

    public static final class RefreshTokenAlreadyRotatedException extends ApiException {
        private RefreshTokenAlreadyRotatedException() {
            super(
                "REFRESH_TOKEN_ALREADY_ROTATED",
                HttpStatus.CONFLICT,
                "Refresh token was already rotated by another request"
            );
        }
    }

    public static final class RefreshTokenReuseException extends ApiException {
        private RefreshTokenReuseException() {
            super(
                "REFRESH_TOKEN_REUSED",
                HttpStatus.UNAUTHORIZED,
                "Session revoked, please log in again"
            );
        }
    }
}
