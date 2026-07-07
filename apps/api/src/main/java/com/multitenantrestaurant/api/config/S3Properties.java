package com.multitenantrestaurant.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storage.s3")
public record S3Properties(
    String endpoint,
    String bucket,
    String region,
    String accessKey,
    String secretKey,
    String publicUrl
) {}
