package com.multitenantrestaurant.api.signup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record InitiateSignupRequest(
    @NotBlank @Pattern(regexp = "^[a-z0-9-]{1,63}$") String domain,
    @NotBlank String tenantName,
    String iconContentType,   // null if no icon
    Long iconSizeBytes        // null if no icon
) {}
