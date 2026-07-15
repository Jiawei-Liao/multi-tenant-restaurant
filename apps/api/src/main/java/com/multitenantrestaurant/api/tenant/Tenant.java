package com.multitenantrestaurant.api.tenant;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tenants")
@Getter @Setter
public class Tenant {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String subdomain;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "icon_key")
    private String iconKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }
}
