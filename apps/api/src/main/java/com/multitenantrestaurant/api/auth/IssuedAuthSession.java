package com.multitenantrestaurant.api.auth;

import java.time.Instant;

import com.multitenantrestaurant.api.auth.dto.AuthSessionResponse;

public record IssuedAuthSession(
    AuthSessionResponse response,
    String refreshToken,
    Instant refreshTokenExpiresAt
) {}
