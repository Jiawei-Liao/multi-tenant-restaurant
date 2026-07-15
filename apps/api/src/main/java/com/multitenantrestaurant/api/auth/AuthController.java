package com.multitenantrestaurant.api.auth;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.multitenantrestaurant.api.auth.dto.AuthSessionResponse;
import com.multitenantrestaurant.api.auth.dto.LoginRequest;
import com.multitenantrestaurant.api.auth.dto.SelectTenantRequest;
import com.multitenantrestaurant.api.auth.dto.SignupRequest;
import com.multitenantrestaurant.api.common.exception.ApiException;
import com.multitenantrestaurant.api.user.User;
import com.multitenantrestaurant.api.user.UserRepository;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionService authSessionService;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenCookieService refreshTokenCookieService;

    @PostMapping("/signup")
    @Transactional
    public AuthSessionResponse signup(@Valid @RequestBody SignupRequest req, HttpServletResponse response) {
        String email = req.email().trim();

        if (userRepository.findByEmailAndDeletedAtIsNull(email).isPresent()) {
            throw emailAlreadyRegistered();
        }

        User user = new User();
        user.setEmail(email);
        user.setFirstName(req.firstName().trim());
        user.setLastName(normaliseOptional(req.lastName()));
        user.setPasswordHash(passwordEncoder.encode(req.password()));

        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw emailAlreadyRegistered();
        }

        IssuedAuthSession session = authSessionService.issueAccount(user);
        refreshTokenCookieService.addRefreshToken(response, session);
        return session.response();
    }

    @PostMapping("/login")
    public AuthSessionResponse login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        String email = req.email().trim();
        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
            .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
            .orElseThrow(() -> invalidCredentials());

        IssuedAuthSession session = authSessionService.issueAccount(user);
        refreshTokenCookieService.addRefreshToken(response, session);
        return session.response();
    }

    @PostMapping("/select-tenant")
    public AuthSessionResponse selectTenant(
        @Valid @RequestBody SelectTenantRequest req,
        @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
        @CookieValue(name = RefreshTokenCookieService.COOKIE_NAME, required = false) String refreshToken,
        HttpServletResponse response
    ) {
        if (authenticatedUser == null) {
            throw invalidSession();
        }
        requireRefreshToken(refreshToken);

        IssuedAuthSession session = authSessionService.selectTenant(
            authenticatedUser.userId(),
            req.tenantId(),
            refreshToken
        );
        refreshTokenCookieService.addRefreshToken(response, session);
        return session.response();
    }

    @PostMapping("/refresh")
    public AuthSessionResponse refresh(
        @CookieValue(name = RefreshTokenCookieService.COOKIE_NAME, required = false) String refreshToken,
        HttpServletResponse response
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        IssuedAuthSession session = authSessionService.refresh(refreshToken);
        refreshTokenCookieService.addRefreshToken(response, session);
        return session.response();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
        @CookieValue(name = RefreshTokenCookieService.COOKIE_NAME, required = false) String refreshToken,
        HttpServletResponse response
    ) {
        try {
            if (refreshToken != null && !refreshToken.isBlank()) {
                refreshTokenService.revokeFamily(refreshToken);
            }
        } finally {
            refreshTokenCookieService.clearRefreshToken(response);
        }
    }

    private ApiException invalidCredentials() {
        return new ApiException("INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    private ApiException emailAlreadyRegistered() {
        return new ApiException("EMAIL_ALREADY_REGISTERED", HttpStatus.CONFLICT, "Email already belongs to an account");
    }

    private ApiException invalidSession() {
        return new ApiException("INVALID_SESSION", HttpStatus.UNAUTHORIZED, "Invalid session");
    }

    private void requireRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
    }

    private String normaliseOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

}
