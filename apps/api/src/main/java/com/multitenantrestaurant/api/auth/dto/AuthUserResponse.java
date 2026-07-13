package com.multitenantrestaurant.api.auth.dto;

import java.util.UUID;

public record AuthUserResponse(
    UUID id,
    String email,
    String firstName,
    String lastName
) {}
