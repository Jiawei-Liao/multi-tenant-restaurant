package com.multitenantrestaurant.api.tenant;

import java.util.UUID;

public final class TenantIconKeys {
    private TenantIconKeys() {}

    public static String of(UUID tenantId) {
        return "tenants/%s/icon".formatted(tenantId);
    }
}
