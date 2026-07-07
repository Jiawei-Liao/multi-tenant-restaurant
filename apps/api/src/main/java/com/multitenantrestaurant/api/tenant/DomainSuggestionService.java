package com.multitenantrestaurant.api.tenant;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DomainSuggestionService {
    private final TenantRepository tenantRepository;

    public List<String> generateSuggestions(String domain) {
        List<String> candidates = List.of(
            domain + "-1",
            domain + "-2",
            domain + "-hq",
            domain + "-co",
            domain + "-official"
        );
        return candidates.stream()
            .filter(c -> !tenantRepository.existsByDomain(c))
            .limit(3)
            .toList();
    }
}
