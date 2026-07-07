package com.multitenantrestaurant.api.common.storage;

import java.time.Duration;

public interface StorageService {
    String generatePresignedUploadUrl(String key, String contentType, Duration expiry);
    boolean exists(String key);
    long getObjectSize(String key);
    void delete(String key);
    String publicUrl(String key);
}
