package com.multitenantrestaurant.api.auth;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface RefreshTokenFamilyRepository extends JpaRepository<RefreshTokenFamily, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM RefreshTokenFamily f WHERE f.id = :id")
    Optional<RefreshTokenFamily> findByIdForUpdate(@Param("id") UUID id);
}
