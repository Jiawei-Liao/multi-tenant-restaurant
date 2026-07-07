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

import com.github.f4b6a3.uuid.UuidCreator;
import com.multitenantrestaurant.api.common.exception.ApiException;
import com.multitenantrestaurant.api.config.JwtProperties;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository repository;
    private final JwtProperties props;
    private static final SecureRandom RANDOM = new SecureRandom();

    public IssuedToken issue(UUID userId) {
        return issue(userId, UuidCreator.getTimeOrderedEpoch());
    }

    private IssuedToken issue(UUID userId, UUID familyId) {
        String rawToken = generateRawToken();
        RefreshToken entity = new RefreshToken();
        entity.setUserId(userId);
        entity.setFamilyId(familyId);
        entity.setTokenHash(hash(rawToken));
        entity.setExpiresAt(Instant.now().plus(props.refreshTokenExpiryDays(), ChronoUnit.DAYS));
        repository.save(entity);
        return new IssuedToken(rawToken, familyId);
    }

    @Transactional
    public RefreshResult rotate(String rawToken) {
        RefreshToken existing = repository.findByTokenHash(hash(rawToken))
            .orElseThrow(() -> new ApiException("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (existing.isRevoked()) {
            repository.revokeFamily(existing.getFamilyId()); // reuse detected — kill the whole session family
            throw new ApiException("REFRESH_TOKEN_REUSED", HttpStatus.UNAUTHORIZED, "Session revoked, please log in again");
        }
        if (existing.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("REFRESH_TOKEN_EXPIRED", HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        existing.setRevoked(true);
        repository.save(existing);

        IssuedToken next = issue(existing.getUserId(), existing.getFamilyId());
        return new RefreshResult(existing.getUserId(), next.rawToken());
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public record IssuedToken(String rawToken, UUID familyId) {}
    public record RefreshResult(UUID userId, String rawToken) {}
}
