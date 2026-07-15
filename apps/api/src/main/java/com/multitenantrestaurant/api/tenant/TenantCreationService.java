package com.multitenantrestaurant.api.tenant;

import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.f4b6a3.uuid.UuidCreator;
import com.multitenantrestaurant.api.auth.dto.AuthTenantResponse;
import com.multitenantrestaurant.api.common.exception.ApiException;
import com.multitenantrestaurant.api.common.storage.StorageObjectMetadata;
import com.multitenantrestaurant.api.common.storage.StorageService;
import com.multitenantrestaurant.api.tenant.dto.CreateTenantRequest;
import com.multitenantrestaurant.api.tenant.dto.InitiateTenantRequest;
import com.multitenantrestaurant.api.tenant.dto.InitiateTenantResponse;
import com.multitenantrestaurant.api.tenant.dto.SubdomainAvailabilityResponse;
import com.multitenantrestaurant.api.user.TenantUser;
import com.multitenantrestaurant.api.user.TenantUserRepository;
import com.multitenantrestaurant.api.user.UserRepository;
import com.multitenantrestaurant.api.user.UserRole;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TenantCreationService {
    static final long MAX_ICON_SIZE_BYTES = 1024L * 1024L;
    static final Duration PRESIGN_EXPIRY = Duration.ofMinutes(10);

    private static final Logger log = LoggerFactory.getLogger(TenantCreationService.class);
    private static final int MAX_SUBDOMAIN_LENGTH = 63;
    private static final int MAX_NAME_LENGTH = 255;
    private static final Pattern SUBDOMAIN_PATTERN = Pattern.compile(
        "^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$"
    );
    private static final Set<String> ALLOWED_ICON_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp"
    );

    private final TenantRepository tenantRepository;
    private final TenantUserRepository tenantUserRepository;
    private final UserRepository userRepository;
    private final SubdomainSuggestionService subdomainSuggestionService;
    private final StorageService storageService;

    public SubdomainAvailabilityResponse checkSubdomainAvailability(String rawSubdomain) {
        String subdomain = normalizeAndValidateSubdomain(rawSubdomain);
        boolean available = !tenantRepository.existsBySubdomain(subdomain);
        List<String> suggestions = available
            ? List.of()
            : subdomainSuggestionService.generateSuggestions(subdomain);
        return new SubdomainAvailabilityResponse(available, suggestions);
    }

    public InitiateTenantResponse initiate(UUID userId, InitiateTenantRequest request) {
        requireActiveUser(userId);
        String subdomain = normalizeAndValidateSubdomain(request.subdomain());
        String name = normalizeAndValidateName(request.name());
        String iconContentType = validateInitiateIcon(request.iconContentType(), request.iconSizeBytes());

        ensureSubdomainAvailable(subdomain);
        ensureNameAvailable(name);

        UUID tenantId = UuidCreator.getTimeOrderedEpoch();
        String iconUploadUrl = iconContentType == null
            ? null
            : storageService.generatePresignedUploadUrl(
                TenantIconKeys.of(tenantId), iconContentType, PRESIGN_EXPIRY
            );

        return new InitiateTenantResponse(tenantId, iconUploadUrl);
    }

    @Transactional
    public AuthTenantResponse create(UUID userId, CreateTenantRequest request) {
        UUID tenantId = request.tenantId();
        if (tenantId == null) {
            throw validationError("tenantId: must not be null");
        }
        if (tenantId.version() != 7) {
            throw validationError("tenantId: must be a valid restaurant creation id");
        }

        boolean hasIcon = request.iconContentType() != null;
        String iconKey = hasIcon ? TenantIconKeys.of(tenantId) : null;

        if (tenantRepository.existsById(tenantId)) {
            throw new ApiException(
                "TENANT_CREATION_CONFLICT",
                HttpStatus.CONFLICT,
                "Restaurant creation session is no longer valid"
            );
        }

        try {
            requireActiveUser(userId);
            String subdomain = normalizeAndValidateSubdomain(request.subdomain());
            String name = normalizeAndValidateName(request.name());
            String iconContentType = validateIconContentType(request.iconContentType());

            String iconUrl = null;
            if (iconContentType != null) {
                StorageObjectMetadata metadata = storageService.stat(iconKey)
                    .orElseThrow(() -> new ApiException(
                        "ICON_UPLOAD_MISSING",
                        HttpStatus.BAD_REQUEST,
                        "Restaurant icon upload was not found"
                    ));
                validateStoredIcon(metadata, iconContentType);
                iconUrl = storageService.publicUrl(iconKey);
            }

            ensureSubdomainAvailable(subdomain);
            ensureNameAvailable(name);

            Tenant tenant = new Tenant();
            tenant.setId(tenantId);
            tenant.setSubdomain(subdomain);
            tenant.setName(name);
            tenant.setIconKey(iconKey);

            TenantUser owner = new TenantUser();
            owner.setTenantId(tenantId);
            owner.setUserId(userId);
            owner.setRole(UserRole.OWNER);

            try {
                tenant = tenantRepository.saveAndFlush(tenant);
                tenantUserRepository.saveAndFlush(owner);
            } catch (DataIntegrityViolationException e) {
                throw mapConstraintViolation(e, subdomain);
            }

            return new AuthTenantResponse(
                tenant.getId(), tenant.getSubdomain(), tenant.getName(), iconUrl, UserRole.OWNER
            );
        } catch (ApiException e) {
            if (hasIcon) {
                deleteBestEffort(iconKey);
            }
            throw e;
        } catch (DataAccessException e) {
            if (hasIcon) {
                deleteBestEffort(iconKey);
            }
            log.error("Could not persist tenant {}", tenantId, e);
            throw new ApiException(
                "TENANT_CREATION_FAILED",
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Could not create restaurant"
            );
        }
    }

    private String validateInitiateIcon(String contentType, Long sizeBytes) {
        String validatedContentType = validateIconContentType(contentType);
        if (validatedContentType == null) {
            if (sizeBytes != null) {
                throw validationError("iconContentType: must be provided when iconSizeBytes is set");
            }
            return null;
        }
        if (sizeBytes == null || sizeBytes <= 0) {
            throw validationError("iconSizeBytes: must be greater than zero when an icon is provided");
        }
        if (sizeBytes > MAX_ICON_SIZE_BYTES) {
            throw iconTooLarge();
        }
        return validatedContentType;
    }

    private String validateIconContentType(String contentType) {
        if (contentType == null) {
            return null;
        }
        if (!ALLOWED_ICON_TYPES.contains(contentType)) {
            throw new ApiException(
                "ICON_TYPE_NOT_ALLOWED",
                HttpStatus.BAD_REQUEST,
                "Icon must be a PNG, JPEG, or WebP image"
            );
        }
        return contentType;
    }

    private void validateStoredIcon(StorageObjectMetadata metadata, String requestedContentType) {
        String storedContentType = metadata.contentType() == null
            ? null
            : metadata.contentType().trim().toLowerCase(Locale.ROOT);
        if (!requestedContentType.equals(storedContentType)) {
            throw new ApiException(
                "ICON_TYPE_NOT_ALLOWED",
                HttpStatus.BAD_REQUEST,
                "Uploaded icon content type does not match"
            );
        }
        if (metadata.sizeBytes() <= 0) {
            throw new ApiException(
                "ICON_UPLOAD_INVALID",
                HttpStatus.BAD_REQUEST,
                "Uploaded icon is empty"
            );
        }
        if (metadata.sizeBytes() > MAX_ICON_SIZE_BYTES) {
            throw iconTooLarge();
        }
    }

    private String normalizeAndValidateSubdomain(String rawSubdomain) {
        if (rawSubdomain == null) {
            throw validationError("subdomain: must not be blank");
        }
        String subdomain = rawSubdomain.trim().toLowerCase(Locale.ROOT);
        if (subdomain.length() > MAX_SUBDOMAIN_LENGTH
            || !SUBDOMAIN_PATTERN.matcher(subdomain).matches()) {
            throw validationError(
                "subdomain: must be 1-63 lowercase letters, numbers, or hyphens, and cannot start or end with a hyphen"
            );
        }
        return subdomain;
    }

    private String normalizeAndValidateName(String rawName) {
        if (rawName == null) {
            throw validationError("name: must not be blank");
        }
        String name = rawName.trim();
        if (name.isEmpty()) {
            throw validationError("name: must not be blank");
        }
        if (name.length() > MAX_NAME_LENGTH) {
            throw validationError("name: size must be between 1 and 255");
        }
        return name;
    }

    private void ensureSubdomainAvailable(String subdomain) {
        if (tenantRepository.existsBySubdomain(subdomain)) {
            throw subdomainTaken(subdomain);
        }
    }

    private void ensureNameAvailable(String name) {
        if (tenantRepository.existsByName(name)) {
            throw new ApiException(
                "NAME_TAKEN", HttpStatus.CONFLICT, "Restaurant name is already taken"
            );
        }
    }

    private void requireActiveUser(UUID userId) {
        if (userId == null || userRepository.findById(userId)
            .filter(user -> user.getDeletedAt() == null)
            .isEmpty()) {
            throw new ApiException("INVALID_SESSION", HttpStatus.UNAUTHORIZED, "Invalid session");
        }
    }

    private ApiException mapConstraintViolation(
        DataIntegrityViolationException exception,
        String subdomain
    ) {
        String message = allCauseMessages(exception);
        if (message.contains("tenants_subdomain_key")) {
            return subdomainTaken(subdomain);
        }
        if (message.contains("tenants_name_key")) {
            return new ApiException(
                "NAME_TAKEN", HttpStatus.CONFLICT, "Restaurant name is already taken"
            );
        }
        if (message.contains("tenants_pkey")) {
            return new ApiException(
                "TENANT_CREATION_CONFLICT",
                HttpStatus.CONFLICT,
                "Restaurant creation session is no longer valid"
            );
        }
        return new ApiException(
            "TENANT_CREATION_FAILED", HttpStatus.CONFLICT, "Could not create restaurant"
        );
    }

    private String allCauseMessages(Throwable throwable) {
        StringBuilder messages = new StringBuilder();
        Throwable current = throwable;
        while (current != null) {
            if (current.getMessage() != null) {
                messages.append(' ').append(current.getMessage().toLowerCase(Locale.ROOT));
            }
            current = current.getCause();
        }
        return messages.toString();
    }

    private ApiException subdomainTaken(String subdomain) {
        return new ApiException(
            "SUBDOMAIN_TAKEN",
            HttpStatus.CONFLICT,
            "Subdomain is already taken",
            subdomainSuggestionService.generateSuggestions(subdomain)
        );
    }

    private ApiException iconTooLarge() {
        return new ApiException(
            "ICON_TOO_LARGE", HttpStatus.BAD_REQUEST, "Icon must be 1 MB or smaller"
        );
    }

    private ApiException validationError(String message) {
        return new ApiException("VALIDATION_ERROR", HttpStatus.BAD_REQUEST, message);
    }

    private void deleteBestEffort(String key) {
        try {
            storageService.delete(key);
        } catch (RuntimeException cleanupError) {
            log.warn("Could not clean up uploaded tenant icon {}", key, cleanupError);
        }
    }
}
