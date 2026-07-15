package com.multitenantrestaurant.api.auth.dto;

import java.util.UUID;

import com.multitenantrestaurant.api.user.UserRole;

public record AuthTenantResponse(
    UUID id,
    String subdomain,
    String name,
    String iconUrl,
    UserRole role
) {}
