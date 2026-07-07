package com.multitenantrestaurant.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.multitenantrestaurant.api.auth.dto.AuthResponse;
import com.multitenantrestaurant.api.auth.dto.LoginRequest;
import com.multitenantrestaurant.api.auth.dto.RefreshRequest;
import com.multitenantrestaurant.api.common.exception.ApiException;
import com.multitenantrestaurant.api.user.User;
import com.multitenantrestaurant.api.user.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(req.email())
            .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
            .orElseThrow(() -> new ApiException("INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        String accessToken = jwtService.generateAccessToken(user);
        var refresh = refreshTokenService.issue(user.getId());
        return new AuthResponse(accessToken, refresh.rawToken());
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        var result = refreshTokenService.rotate(req.refreshToken());
        User user = userRepository.findById(result.userId())
            .orElseThrow(() -> new ApiException("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        return new AuthResponse(jwtService.generateAccessToken(user), result.rawToken());
    }
}
