package com.multitenantrestaurant.api.common.storage;

import java.time.Duration;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.multitenantrestaurant.api.config.S3Properties;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
@RequiredArgsConstructor
public class S3StorageService implements StorageService {
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties props;

    @Override
    public String generatePresignedUploadUrl(String key, String contentType, Duration expiry) {
        PutObjectRequest objectRequest = PutObjectRequest.builder()
            .bucket(props.bucket())
            .key(key)
            .contentType(contentType) // locks content-type into the signature
            .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(expiry)
            .putObjectRequest(objectRequest)
            .build();

        return s3Presigner.presignPutObject(presignRequest).url().toString();
    }

    @Override
    public Optional<StorageObjectMetadata> stat(String key) {
        try {
            var response = s3Client.headObject(HeadObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .build());
            return Optional.of(new StorageObjectMetadata(response.contentLength(), response.contentType()));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        } catch (S3Exception e) {
            // HeadObject has no response body, so missing objects commonly surface as a
            // generic S3Exception rather than the modelled NoSuchKeyException.
            if (e.statusCode() == 404) {
                return Optional.empty();
            }
            throw e;
        }
    }

    @Override
    public void delete(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(props.bucket()).key(key).build());
    }

    @Override
    public String publicUrl(String key) {
        return props.publicUrl() + "/" + key;
    }
}
