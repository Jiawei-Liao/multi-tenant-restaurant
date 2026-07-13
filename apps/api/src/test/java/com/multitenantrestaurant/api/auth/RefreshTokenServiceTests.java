package com.multitenantrestaurant.api.auth;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.multitenantrestaurant.api.config.JwtProperties;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTests {
    @Mock
    private RefreshTokenRepository repository;

    @Mock
    private RefreshTokenFamilyRepository familyRepository;

    private final Map<UUID, RefreshToken> tokens = new HashMap<>();
    private final Map<UUID, RefreshTokenFamily> families = new HashMap<>();
    private RefreshTokenService service;

    @BeforeEach
    void setUp() {
        var properties = new JwtProperties("a-secure-test-secret-that-is-long-enough", 15, 30, 5);
        service = new RefreshTokenService(repository, familyRepository, properties);

        when(familyRepository.save(any(RefreshTokenFamily.class))).thenAnswer(invocation -> {
            RefreshTokenFamily family = invocation.getArgument(0);
            family.onCreate();
            families.put(family.getId(), family);
            return family;
        });
        when(familyRepository.findByIdForUpdate(any(UUID.class))).thenAnswer(invocation ->
            Optional.ofNullable(families.get(invocation.getArgument(0)))
        );

        when(repository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken token = invocation.getArgument(0);
            token.onCreate();
            tokens.put(token.getId(), token);
            return token;
        });
        when(repository.findByTokenHash(anyString())).thenAnswer(invocation -> {
            String tokenHash = invocation.getArgument(0);
            return tokens.values().stream()
                .filter(token -> token.getTokenHash().equals(tokenHash))
                .findFirst();
        });
        when(repository.findFamilyIdByTokenHash(anyString())).thenAnswer(invocation -> {
            String tokenHash = invocation.getArgument(0);
            return tokens.values().stream()
                .filter(token -> token.getTokenHash().equals(tokenHash))
                .map(RefreshToken::getFamilyId)
                .findFirst();
        });
    }

    @Test
    void concurrentRotationReturnsConflictWithoutRevokingTheFamily() {
        UUID userId = UUID.randomUUID();
        var issued = service.issue(userId, null);

        service.rotate(issued.rawToken());

        RefreshToken original = tokens.get(issued.tokenId());
        assertNotNull(original.getRotatedAt());
        assertThrows(
            RefreshTokenService.RefreshTokenAlreadyRotatedException.class,
            () -> service.rotate(issued.rawToken())
        );
        verify(repository, never()).revokeFamily(any(UUID.class), any(Instant.class));
    }

    @Test
    void reuseOutsideTheConcurrencyWindowRevokesActiveDescendants() {
        UUID userId = UUID.randomUUID();
        var issued = service.issue(userId, null);

        service.rotate(issued.rawToken());

        RefreshToken original = tokens.get(issued.tokenId());
        original.setRotatedAt(Instant.now().minus(6, ChronoUnit.SECONDS));

        assertThrows(
            RefreshTokenService.RefreshTokenReuseException.class,
            () -> service.rotate(issued.rawToken())
        );
        verify(repository).revokeFamily(any(UUID.class), any(Instant.class));
    }
}
