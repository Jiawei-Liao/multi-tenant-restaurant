package com.multitenantrestaurant.api.auth;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.multitenantrestaurant.api.auth.dto.AuthSessionResponse;
import com.multitenantrestaurant.api.auth.dto.AuthTenantResponse;
import com.multitenantrestaurant.api.auth.dto.AuthUserResponse;
import com.multitenantrestaurant.api.common.exception.ApiException;
import com.multitenantrestaurant.api.common.storage.StorageService;
import com.multitenantrestaurant.api.tenant.Tenant;
import com.multitenantrestaurant.api.tenant.TenantRepository;
import com.multitenantrestaurant.api.user.TenantUser;
import com.multitenantrestaurant.api.user.TenantUserRepository;
import com.multitenantrestaurant.api.user.User;
import com.multitenantrestaurant.api.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthSessionService {
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final TenantUserRepository tenantUserRepository;
    private final TenantRepository tenantRepository;
    private final StorageService storageService;

    public IssuedAuthSession issueAccount(User user) {
        var refresh = refreshTokenService.issue(user.getId(), null);
        return new IssuedAuthSession(
            toAccountResponse(user),
            refresh.rawToken(),
            refresh.expiresAt()
        );
    }

    @Transactional(noRollbackFor = RefreshTokenService.RefreshTokenReuseException.class)
    public IssuedAuthSession selectTenant(UUID userId, UUID tenantId, String rawRefreshToken) {
        User user = userRepository.findById(userId)
            .filter(candidate -> candidate.getDeletedAt() == null)
            .orElseThrow(this::invalidSession);
        TenantUser tenantUser = tenantUserRepository
            .findByUserIdAndTenantIdAndDeletedAtIsNull(userId, tenantId)
            .orElseThrow(() -> new ApiException(
                "TENANT_ACCESS_DENIED",
                HttpStatus.FORBIDDEN,
                "You do not have access to this restaurant"
            ));
        Tenant tenant = tenantRepository.findById(tenantUser.getTenantId())
            .orElseThrow(this::invalidSession);
        var refresh = refreshTokenService.rotateAndSelect(
            rawRefreshToken, user.getId(), tenantUser.getId()
        );
        return new IssuedAuthSession(
            toResponse(user, tenantUser, tenant),
            refresh.rawToken(),
            refresh.expiresAt()
        );
    }

    @Transactional(noRollbackFor = RefreshTokenService.RefreshTokenReuseException.class)
    public IssuedAuthSession refresh(String rawRefreshToken) {
        var result = refreshTokenService.rotate(rawRefreshToken);
        User user = userRepository.findById(result.userId())
            .filter(u -> u.getDeletedAt() == null)
            .orElseThrow(this::invalidSession);

        if (result.selectedTenantUserId() == null) {
            return new IssuedAuthSession(
                toAccountResponse(user),
                result.rawToken(),
                result.expiresAt()
            );
        }

        TenantUser tenantUser = tenantUserRepository.findByIdAndDeletedAtIsNull(result.selectedTenantUserId())
            .filter(membership -> membership.getUserId().equals(user.getId()))
            .orElse(null);

        if (tenantUser == null) {
            refreshTokenService.clearSelection(result.tokenId());
            return new IssuedAuthSession(
                toAccountResponse(user),
                result.rawToken(),
                result.expiresAt()
            );
        }

        Tenant tenant = tenantRepository.findById(tenantUser.getTenantId())
            .orElseThrow(this::invalidSession);

        return new IssuedAuthSession(
            toResponse(user, tenantUser, tenant),
            result.rawToken(),
            result.expiresAt()
        );
    }

    public AuthUserResponse toUserResponse(User user) {
        return new AuthUserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());
    }

    public AuthTenantResponse toTenantResponse(TenantUser tenantUser) {
        Tenant tenant = tenantRepository.findById(tenantUser.getTenantId())
            .orElseThrow(this::invalidSession);
        return toTenantResponse(tenantUser, tenant);
    }

    public AuthTenantResponse toTenantResponse(TenantUser tenantUser, Tenant tenant) {
        String iconUrl = tenant.getIconKey() == null ? null : storageService.publicUrl(tenant.getIconKey());

        return new AuthTenantResponse(
            tenant.getId(), tenant.getSubdomain(), tenant.getName(), iconUrl, tenantUser.getRole()
        );
    }

    public List<AuthTenantResponse> toTenantResponses(User user) {
        return tenantUserRepository.findByUserIdAndDeletedAtIsNull(user.getId()).stream()
            .map(this::toTenantResponse)
            .toList();
    }

    private AuthSessionResponse toResponse(User user, TenantUser tenantUser, Tenant tenant) {
        AuthTenantResponse tenantResponse = toTenantResponse(tenantUser, tenant);

        return new AuthSessionResponse(
            jwtService.generateAccessToken(user, tenantUser),
            toUserResponse(user),
            tenantResponse,
            toTenantResponses(user)
        );
    }

    private AuthSessionResponse toAccountResponse(User user) {
        return new AuthSessionResponse(
            jwtService.generateAccountAccessToken(user),
            toUserResponse(user),
            null,
            toTenantResponses(user)
        );
    }

    private ApiException invalidSession() {
        return new ApiException("INVALID_SESSION", HttpStatus.UNAUTHORIZED, "Invalid session");
    }
}
