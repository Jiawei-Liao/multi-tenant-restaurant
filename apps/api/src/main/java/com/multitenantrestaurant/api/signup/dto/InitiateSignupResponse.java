package com.multitenantrestaurant.api.signup.dto;

import java.util.UUID;

public record InitiateSignupResponse(UUID tenantId, String iconUploadUrl) {}
