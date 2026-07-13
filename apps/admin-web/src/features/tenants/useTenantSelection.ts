import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getTenantHomePath, useAuth } from "@/features/auth";

export type UseTenantSelectionOptions = {
  onSelectionError?: (tenantId: string) => void;
};

export function useTenantSelection({
  onSelectionError,
}: UseTenantSelectionOptions = {}) {
  const navigate = useNavigate();
  const { user, currentTenant, selectTenant } = useAuth();
  const [pendingTenantId, setPendingTenantId] = useState<string | null>(null);
  const selectionInFlightRef = useRef(false);

  const openTenant = useCallback(
    async (tenantId: string): Promise<boolean> => {
      if (!user || selectionInFlightRef.current) {
        return false;
      }

      if (currentTenant?.id === tenantId) {
        navigate(getTenantHomePath(currentTenant), { replace: true });
        return true;
      }

      selectionInFlightRef.current = true;
      setPendingTenantId(tenantId);

      try {
        const tenant = await selectTenant(tenantId);
        navigate(getTenantHomePath(tenant), { replace: true });
        return true;
      } catch {
        toast.error("Could not open that restaurant.");
        onSelectionError?.(tenantId);
        return false;
      } finally {
        selectionInFlightRef.current = false;
        setPendingTenantId(null);
      }
    },
    [currentTenant, navigate, onSelectionError, selectTenant, user],
  );

  return {
    openTenant,
    pendingTenantId,
    isSelecting: pendingTenantId !== null,
  };
}
