package com.multitenantrestaurant.api.signup.dto;

import java.util.UUID;

public record SignupResponse(
    UUID tenantId,
    String domain,
    String tenantName,
    String iconUrl,
    String accessToken,
    String refreshToken
) {}
