package com.multitenantrestaurant.api.auth;

import java.util.UUID;

import com.multitenantrestaurant.api.user.UserRole;

public record AuthenticatedUser(UUID userId, UUID tenantId, UUID tenantUserId, UserRole role) {}
