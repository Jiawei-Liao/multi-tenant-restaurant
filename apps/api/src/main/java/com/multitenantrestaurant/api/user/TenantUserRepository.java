package com.multitenantrestaurant.api.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantUserRepository extends JpaRepository<TenantUser, UUID> {
    List<TenantUser> findByUserIdAndDeletedAtIsNull(UUID userId);
    Optional<TenantUser> findByIdAndDeletedAtIsNull(UUID id);
    Optional<TenantUser> findByUserIdAndTenantIdAndDeletedAtIsNull(UUID userId, UUID tenantId);
}
