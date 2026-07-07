import { useCallback, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "@multi-tenant-restaurant/ui";
import { cn } from "@multi-tenant-restaurant/ui";

type AsyncButtonState = "idle" | "loading" | "slow" | "success" | "error";

interface AsyncButtonProps {
  /**
   * 'oneshot' — navigates away on success, button never reverts.
   * 'reusable' — button reverts to idle after autoRevertMs.
   */
  mode?: "oneshot" | "reusable";
  isDisabled?: boolean;
  autoRevertMs?: number;

  idleText: string;
  loadingText: string;
  slowText: string;
  slowThresholdMs?: number;
  completedText?: string;

  className?: string;
  onClick: () => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
}

export function AsyncButton({
  mode = "reusable",
  isDisabled = false,
  autoRevertMs = 1500,
  idleText,
  loadingText,
  slowText,
  slowThresholdMs = 2000,
  completedText = "Done",
  className,
  onClick,
  onSuccess,
  onError,
}: AsyncButtonProps) {
  const [state, setState] = useState<AsyncButtonState>("idle");
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (state !== "idle" || isDisabled) return;

    setState("loading");

    // Start slow-threshold timer
    slowTimerRef.current = setTimeout(() => {
      setState((current) => (current === "loading" ? "slow" : current));
    }, slowThresholdMs);

    try {
      const result = await onClick();

      clearTimeout(slowTimerRef.current!);
      setState("success");
      onSuccess?.(result);

      if (mode === "reusable") {
        revertTimerRef.current = setTimeout(() => {
          setState("idle");
        }, autoRevertMs);
      }
    } catch (error) {
      clearTimeout(slowTimerRef.current!);
      setState("idle");
      onError?.(error);
    }
  }, [state, isDisabled, onClick, onSuccess, onError, mode, slowThresholdMs, autoRevertMs]);

  const isLoading = state === "loading" || state === "slow";
  const isSuccess = state === "success";

  return (
    <Button
      type="button"
      disabled={isDisabled || isLoading || isSuccess}
      onClick={handleClick}
      className={cn("relative", className)}
    >
      {isLoading && (
        <LoaderCircle
          className="animate-spin"
          aria-hidden="true"
        />
      )}
      {isSuccess && (
        <Check aria-hidden="true" />
      )}
      <span>
        {state === "idle" && idleText}
        {state === "loading" && loadingText}
        {state === "slow" && slowText}
        {state === "success" && completedText}
      </span>
    </Button>
  );
}
