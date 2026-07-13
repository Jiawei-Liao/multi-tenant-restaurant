package com.multitenantrestaurant.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth.cookie")
public record AuthCookieProperties(
    boolean secure,
    String sameSite,
    String refreshTokenPath
) {
    public AuthCookieProperties {
        if (sameSite == null || sameSite.isBlank()) {
            sameSite = "Lax";
        } else if (sameSite.equalsIgnoreCase("lax")) {
            sameSite = "Lax";
        } else if (sameSite.equalsIgnoreCase("strict")) {
            sameSite = "Strict";
        } else {
            throw new IllegalArgumentException(
                "auth.cookie.same-site must be Lax or Strict until CSRF protection is configured"
            );
        }
        if (refreshTokenPath == null || refreshTokenPath.isBlank()) {
            refreshTokenPath = "/api/auth";
        } else if (!refreshTokenPath.startsWith("/")) {
            throw new IllegalArgumentException("auth.cookie.refresh-token-path must be an absolute path");
        }
    }
}
