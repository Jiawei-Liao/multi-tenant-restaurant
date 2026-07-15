package com.multitenantrestaurant.api.tenant;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.multitenantrestaurant.api.auth.AuthenticatedUser;
import com.multitenantrestaurant.api.auth.dto.AuthTenantResponse;
import com.multitenantrestaurant.api.common.exception.ApiException;
import com.multitenantrestaurant.api.tenant.dto.CreateTenantRequest;
import com.multitenantrestaurant.api.tenant.dto.InitiateTenantRequest;
import com.multitenantrestaurant.api.tenant.dto.InitiateTenantResponse;
import com.multitenantrestaurant.api.tenant.dto.SubdomainAvailabilityResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {
    private final TenantCreationService tenantCreationService;

    @GetMapping("/subdomain-availability")
    public SubdomainAvailabilityResponse checkSubdomain(
        @RequestParam(required = false) String subdomain
    ) {
        return tenantCreationService.checkSubdomainAvailability(subdomain);
    }

    @PostMapping("/initiate")
    public InitiateTenantResponse initiate(
        @Valid @RequestBody InitiateTenantRequest request,
        @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        requireAuthenticated(authenticatedUser);
        return tenantCreationService.initiate(authenticatedUser.userId(), request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AuthTenantResponse create(
        @Valid @RequestBody CreateTenantRequest request,
        @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        requireAuthenticated(authenticatedUser);
        return tenantCreationService.create(authenticatedUser.userId(), request);
    }

    private void requireAuthenticated(AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new ApiException("INVALID_SESSION", HttpStatus.UNAUTHORIZED, "Invalid session");
        }
    }
}
