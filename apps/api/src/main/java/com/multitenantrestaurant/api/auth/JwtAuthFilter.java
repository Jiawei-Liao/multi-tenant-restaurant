package com.multitenantrestaurant.api.auth;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.multitenantrestaurant.api.user.UserRole;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.parse(header.substring(7));
                if ("access".equals(claims.get("tokenType", String.class))) {
                    UUID userId = UUID.fromString(claims.getSubject());
                    UUID tenantId = parseUuidClaim(claims, "tenantId");
                    UUID tenantUserId = parseUuidClaim(claims, "tenantUserId");
                    UserRole role = parseRoleClaim(claims);
                    var authorities = role == null
                        ? Collections.<SimpleGrantedAuthority>emptyList()
                        : List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
                    var principal = new AuthenticatedUser(userId, tenantId, tenantUserId, role);
                    var authToken = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (JwtException | IllegalArgumentException | NullPointerException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    private UUID parseUuidClaim(Claims claims, String name) {
        String value = claims.get(name, String.class);
        return value == null ? null : UUID.fromString(value);
    }

    private UserRole parseRoleClaim(Claims claims) {
        String value = claims.get("role", String.class);
        return value == null ? null : UserRole.valueOf(value);
    }
}
