package com.multitenantrestaurant.api.tenant.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTenantRequest(
    @NotNull UUID tenantId,
    @NotBlank String subdomain,
    @NotBlank String name,
    String iconContentType
) {}
