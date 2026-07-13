package com.multitenantrestaurant.api.auth;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Query("SELECT r.familyId FROM RefreshToken r WHERE r.tokenHash = :tokenHash")
    Optional<UUID> findFamilyIdByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE RefreshToken r SET r.revokedAt = :revokedAt
        WHERE r.familyId = :familyId AND r.revokedAt IS NULL
        """)
    void revokeFamily(@Param("familyId") UUID familyId, @Param("revokedAt") Instant revokedAt);
}
