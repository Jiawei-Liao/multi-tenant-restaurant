package com.multitenantrestaurant.api.auth.dto;

import java.util.UUID;

import com.multitenantrestaurant.api.user.UserRole;

public record AuthTenantResponse(
    UUID id,
    String domain,
    String name,
    String iconUrl,
    UserRole role
) {}
