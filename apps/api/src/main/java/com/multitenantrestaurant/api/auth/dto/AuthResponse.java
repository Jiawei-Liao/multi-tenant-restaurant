package com.multitenantrestaurant.api.auth.dto;

public record AuthResponse(String accessToken, String refreshToken) {}
