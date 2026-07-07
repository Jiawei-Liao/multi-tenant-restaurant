package com.multitenantrestaurant.api.common.storage;

import java.time.Duration;

import org.springframework.stereotype.Service;

import com.multitenantrestaurant.api.config.S3Properties;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
@RequiredArgsConstructor
public class S3StorageService implements StorageService {
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final S3Properties props;

    @Override
    public long getObjectSize(String key) {
        return s3Client.headObject(HeadObjectRequest.builder().bucket(props.bucket()).key(key).build()).contentLength();
    }

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
    public boolean exists(String key) {
        try {
            s3Client.headObject(HeadObjectRequest.builder().bucket(props.bucket()).key(key).build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
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
