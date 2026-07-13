package com.multitenantrestaurant.api.tenant;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantInviteRepository extends JpaRepository<TenantInvite, UUID> {
    Optional<TenantInvite> findByTokenHash(String tokenHash);
    Optional<TenantInvite> findByTenantIdAndEmail(UUID tenantId, String email);
}
