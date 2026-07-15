package com.multitenantrestaurant.api.tenant.dto;

import java.util.UUID;

public record InitiateTenantResponse(UUID tenantId, String iconUploadUrl) {}
