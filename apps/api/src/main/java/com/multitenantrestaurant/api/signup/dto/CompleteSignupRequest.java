package com.multitenantrestaurant.api.signup.dto;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CompleteSignupRequest(
    @NotNull UUID tenantId,
    @NotBlank String domain,
    @NotBlank String tenantName,
    @NotBlank @Email String ownerEmail,
    @NotBlank @Size(min = 8) String password
) {}
