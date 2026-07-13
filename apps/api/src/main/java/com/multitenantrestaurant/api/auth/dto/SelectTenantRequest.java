package com.multitenantrestaurant.api.auth.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record SelectTenantRequest(@NotNull UUID tenantId) {}
