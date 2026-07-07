package com.multitenantrestaurant.api.signup;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.multitenantrestaurant.api.signup.dto.CompleteSignupRequest;
import com.multitenantrestaurant.api.signup.dto.DomainAvailabilityResponse;
import com.multitenantrestaurant.api.signup.dto.InitiateSignupRequest;
import com.multitenantrestaurant.api.signup.dto.InitiateSignupResponse;
import com.multitenantrestaurant.api.signup.dto.SignupResponse;
import com.multitenantrestaurant.api.tenant.DomainSuggestionService;
import com.multitenantrestaurant.api.tenant.TenantRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/signup")
@RequiredArgsConstructor
public class SignupController {
    private final SignupService signupService;
    private final DomainSuggestionService domainSuggestionService;
    private final TenantRepository tenantRepository;

    @GetMapping("/domain-availability")
    public DomainAvailabilityResponse checkDomain(@RequestParam String domain) {
        boolean available = !tenantRepository.existsByDomain(domain);
        List<String> suggestions = available ? List.of() : domainSuggestionService.generateSuggestions(domain);
        return new DomainAvailabilityResponse(available, suggestions);
    }

    @PostMapping("/initiate")
    public InitiateSignupResponse initiate(@Valid @RequestBody InitiateSignupRequest req) {
        return signupService.initiate(req);
    }

    @PostMapping
    public SignupResponse complete(@Valid @RequestBody CompleteSignupRequest req) {
        return signupService.complete(req);
    }
}
