package com.multitenantrestaurant.api.tenant.dto;

import jakarta.validation.constraints.NotBlank;

public record InitiateTenantRequest(
    @NotBlank String subdomain,
    @NotBlank String name,
    String iconContentType,
    Long iconSizeBytes
) {}
