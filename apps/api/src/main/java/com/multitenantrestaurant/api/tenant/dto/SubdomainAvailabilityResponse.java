package com.multitenantrestaurant.api.tenant.dto;

import java.util.List;

public record SubdomainAvailabilityResponse(boolean available, List<String> suggestions) {}
