package com.multitenantrestaurant.api.tenant;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    boolean existsBySubdomain(String subdomain);
    boolean existsByName(String name);
    Optional<Tenant> findBySubdomain(String subdomain);
}
