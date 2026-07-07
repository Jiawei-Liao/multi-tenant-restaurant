package com.multitenantrestaurant.api.signup.dto;

import java.util.List;

public record DomainAvailabilityResponse(boolean available, List<String> suggestions) {}
