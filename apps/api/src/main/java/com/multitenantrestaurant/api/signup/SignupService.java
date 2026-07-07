package com.multitenantrestaurant.api.signup;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.github.f4b6a3.uuid.UuidCreator;
import com.multitenantrestaurant.api.auth.JwtService;
import com.multitenantrestaurant.api.auth.RefreshTokenService;
import com.multitenantrestaurant.api.common.exception.ApiException;
import com.multitenantrestaurant.api.common.storage.StorageService;
import com.multitenantrestaurant.api.signup.dto.CompleteSignupRequest;
import com.multitenantrestaurant.api.signup.dto.InitiateSignupRequest;
import com.multitenantrestaurant.api.signup.dto.InitiateSignupResponse;
import com.multitenantrestaurant.api.signup.dto.SignupResponse;
import com.multitenantrestaurant.api.tenant.DomainSuggestionService;
import com.multitenantrestaurant.api.tenant.Tenant;
import com.multitenantrestaurant.api.tenant.TenantIconKeys;
import com.multitenantrestaurant.api.tenant.TenantRepository;
import com.multitenantrestaurant.api.user.User;
import com.multitenantrestaurant.api.user.UserRepository;
import com.multitenantrestaurant.api.user.UserRole;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SignupService {
    private static final Set<String> ALLOWED_ICON_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_ICON_SIZE = 1 * 1024 * 1024;
    private static final Duration PRESIGN_EXPIRY = Duration.ofMinutes(10);

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final DomainSuggestionService domainSuggestionService;
    private final StorageService storageService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public InitiateSignupResponse initiate(InitiateSignupRequest req) {
        if (tenantRepository.existsByDomain(req.domain())) {
            throw new ApiException("DOMAIN_TAKEN", HttpStatus.CONFLICT, "Domain is already taken",
                domainSuggestionService.generateSuggestions(req.domain()));
        }
        if (tenantRepository.existsByName(req.tenantName())) {
            throw new ApiException("NAME_TAKEN", HttpStatus.CONFLICT, "Restaurant name is already taken");
        }

        UUID tenantId = UuidCreator.getTimeOrderedEpoch();
        String iconUploadUrl = null;

        if (req.iconContentType() != null) {
            if (!ALLOWED_ICON_TYPES.contains(req.iconContentType())) {
                throw new ApiException("ICON_TYPE_NOT_ALLOWED", HttpStatus.BAD_REQUEST, "Icon must be JPG, PNG, or WEBP");
            }
            if (req.iconSizeBytes() == null || req.iconSizeBytes() > MAX_ICON_SIZE) {
                throw new ApiException("ICON_TOO_LARGE", HttpStatus.BAD_REQUEST, "Icon must be under 5MB");
            }
            iconUploadUrl = storageService.generatePresignedUploadUrl(
                TenantIconKeys.of(tenantId), req.iconContentType(), PRESIGN_EXPIRY);
        }

        return new InitiateSignupResponse(tenantId, iconUploadUrl);
    }

    @Transactional
    public SignupResponse complete(CompleteSignupRequest req) {
        String iconKey = TenantIconKeys.of(req.tenantId());
        boolean hasIcon = storageService.exists(iconKey);

        if (hasIcon && storageService.getObjectSize(iconKey) > MAX_ICON_SIZE) {
            storageService.delete(iconKey);
            throw new ApiException("ICON_TOO_LARGE", HttpStatus.BAD_REQUEST, "Icon must be under 1MB");
        }

        Tenant tenant = new Tenant();
        tenant.setId(req.tenantId());
        tenant.setDomain(req.domain());
        tenant.setName(req.tenantName());
        tenant.setIconKey(hasIcon ? iconKey : null);

        User owner = new User();
        owner.setTenantId(req.tenantId());
        owner.setEmail(req.ownerEmail());
        owner.setPasswordHash(passwordEncoder.encode(req.password()));
        owner.setRole(UserRole.OWNER);

        try {
            tenant = tenantRepository.save(tenant);
            owner = userRepository.save(owner);
        } catch (DataIntegrityViolationException e) {
            if (hasIcon) {
                storageService.delete(iconKey); // don't leave an orphaned icon behind
            }
            throw mapConstraintViolation(e, req.domain());
        }

        String accessToken = jwtService.generateAccessToken(owner);
        var refresh = refreshTokenService.issue(owner.getId());

        return new SignupResponse(
            tenant.getId(), tenant.getDomain(), tenant.getName(),
            hasIcon ? storageService.publicUrl(iconKey) : null,
            accessToken, refresh.rawToken()
        );
    }

    private ApiException mapConstraintViolation(DataIntegrityViolationException e, String domain) {
        String message = e.getMostSpecificCause().getMessage();
        if (message != null && message.contains("tenants_domain_key")) {
            return new ApiException("DOMAIN_TAKEN", HttpStatus.CONFLICT, "Domain is already taken",
                domainSuggestionService.generateSuggestions(domain));
        }
        if (message != null && message.contains("tenants_name_key")) {
            return new ApiException("NAME_TAKEN", HttpStatus.CONFLICT, "Restaurant name is already taken");
        }
        if (message != null && message.contains("tenants_pkey")) {
            return new ApiException("SIGNUP_EXPIRED", HttpStatus.CONFLICT, "Signup session expired, please start again");
        }
        return new ApiException("SIGNUP_FAILED", HttpStatus.CONFLICT, "Could not complete signup");
    }
}
