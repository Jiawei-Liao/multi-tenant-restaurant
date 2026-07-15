package com.multitenantrestaurant.api.tenant;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubdomainSuggestionService {
    private static final int MAX_SUBDOMAIN_LENGTH = 63;
    private static final int MAX_SUGGESTIONS = 3;
    private static final List<String> SUFFIXES = List.of(
        "-hq", "-co", "-official", "-eats", "-kitchen"
    );
    private static final List<String> PREFIXES = List.of("the-", "order-");

    private final TenantRepository tenantRepository;

    public List<String> generateSuggestions(String subdomain) {
        Set<String> candidates = generateCandidates(subdomain);
        return candidates.stream()
            .filter(candidate -> !candidate.equals(subdomain))
            .filter(candidate -> !tenantRepository.existsBySubdomain(candidate))
            .limit(MAX_SUGGESTIONS)
            .toList();
    }

    private Set<String> generateCandidates(String subdomain) {
        String condensed = subdomain.replace("-", "");
        Set<String> candidates = new LinkedHashSet<>();

        candidates.add(condensed);

        for (String base : List.of(subdomain, condensed)) {
            for (String suffix : SUFFIXES) {
                candidates.add(withSuffix(base, suffix));
            }
            for (String prefix : PREFIXES) {
                candidates.add(withPrefix(base, prefix));
            }
        }

        return candidates;
    }

    private String withSuffix(String base, String suffix) {
        int baseLength = Math.min(base.length(), MAX_SUBDOMAIN_LENGTH - suffix.length());
        return base.substring(0, baseLength) + suffix;
    }

    private String withPrefix(String base, String prefix) {
        int maxBaseLength = MAX_SUBDOMAIN_LENGTH - prefix.length();
        String trimmedBase = base.substring(0, Math.min(base.length(), maxBaseLength));
        trimmedBase = trimmedBase.replaceFirst("-+$", "");
        return prefix + trimmedBase;
    }
}
