package com.multitenantrestaurant.api.config;

import java.net.URI;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
@EnableConfigurationProperties(S3Properties.class)
public class S3Config {

    private S3Configuration serviceConfiguration() {
        return S3Configuration.builder()
            .pathStyleAccessEnabled(true) // needed for R2
            .build();
    }

    @Bean
    public S3Client s3Client(S3Properties props) {
        return S3Client.builder()
            .endpointOverride(URI.create(props.endpoint()))
            .region(Region.of(props.region()))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(props.accessKey(), props.secretKey())))
            .serviceConfiguration(serviceConfiguration())
            .build();
    }

    @Bean
    public S3Presigner s3Presigner(S3Properties props) {
        return S3Presigner.builder()
            .endpointOverride(URI.create(props.endpoint()))
            .region(Region.of(props.region()))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(props.accessKey(), props.secretKey())))
            .serviceConfiguration(serviceConfiguration())
            .build();
    }
}
