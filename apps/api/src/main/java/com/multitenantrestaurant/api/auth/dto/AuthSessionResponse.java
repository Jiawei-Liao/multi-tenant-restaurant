package com.multitenantrestaurant.api.auth.dto;

import java.util.List;

public record AuthSessionResponse(
    String accessToken,
    AuthUserResponse user,
    AuthTenantResponse tenant,
    List<AuthTenantResponse> tenants
) {}
