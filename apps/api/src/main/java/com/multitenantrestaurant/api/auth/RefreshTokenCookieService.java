package com.multitenantrestaurant.api.auth;

import java.time.Duration;
import java.time.Instant;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import com.multitenantrestaurant.api.config.AuthCookieProperties;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenCookieService {
    public static final String COOKIE_NAME = "refresh_token";

    private final AuthCookieProperties cookieProperties;

    public void addRefreshToken(HttpServletResponse response, IssuedAuthSession session) {
        Duration remainingLifetime = Duration.between(
            Instant.now(),
            session.refreshTokenExpiresAt()
        );

        if (remainingLifetime.isNegative()) {
            remainingLifetime = Duration.ZERO;
        }

        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, session.refreshToken())
            .httpOnly(true)
            .secure(cookieProperties.secure())
            .sameSite(cookieProperties.sameSite())
            .path(cookieProperties.refreshTokenPath())
            .maxAge(remainingLifetime)
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearRefreshToken(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, "")
            .httpOnly(true)
            .secure(cookieProperties.secure())
            .sameSite(cookieProperties.sameSite())
            .path(cookieProperties.refreshTokenPath())
            .maxAge(Duration.ZERO)
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
