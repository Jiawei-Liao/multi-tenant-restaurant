package com.multitenantrestaurant.api.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cors")
public record CorsProperties(List<String> allowedOriginPatterns) {
    public CorsProperties {
        allowedOriginPatterns = List.copyOf(allowedOriginPatterns);

        if (allowedOriginPatterns.isEmpty()) {
            throw new IllegalArgumentException("cors.allowed-origin-patterns must not be empty");
        }
    }
}
