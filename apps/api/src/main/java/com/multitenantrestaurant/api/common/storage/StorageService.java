package com.multitenantrestaurant.api.common.storage;

import java.time.Duration;
import java.util.Optional;

public interface StorageService {
    String generatePresignedUploadUrl(String key, String contentType, Duration expiry);
    Optional<StorageObjectMetadata> stat(String key);
    void delete(String key);
    String publicUrl(String key);
}
