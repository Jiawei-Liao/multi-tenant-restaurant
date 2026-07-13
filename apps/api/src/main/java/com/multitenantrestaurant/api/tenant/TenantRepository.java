package com.multitenantrestaurant.api.tenant;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    boolean existsByDomain(String domain);
    boolean existsByName(String name);
    Optional<Tenant> findByDomain(String domain);
}
