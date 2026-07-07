import { useEffect, useState } from "react";
import { checkDomainAvailability } from "../../api";
import {
  DOMAIN_CHECK_DELAY_MS,
  ICON_MAX_BYTES,
  ICON_TYPES,
  DomainCheckError,
  DomainTakenError,
} from "../../types";
import type { DomainStatus } from "../../types";
import {
  createDomainFromName,
  filterDomainInput,
  getDomainValidationMessage,
  getIconValidationMessage,
} from "../../utils";

export function useRestaurantStep() {
  const [restaurantName, setRestaurantName] = useState("");
  const [domain, setDomain] = useState("");
  const [domainEdited, setDomainEdited] = useState(false);
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("idle");
  const [domainMessage, setDomainMessage] = useState("");
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([]);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconError, setIconError] = useState("");
  const [iconInputKey, setIconInputKey] = useState(0);

  // Auto-derive domain from restaurant name until user manually edits it
  useEffect(() => {
    if (!domainEdited) {
      setDomain(createDomainFromName(restaurantName));
    }
  }, [domainEdited, restaurantName]);

  // Generate / revoke icon object URL
  useEffect(() => {
    if (!iconFile) {
      setIconPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(iconFile);
    setIconPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [iconFile]);

  // Domain availability check with debounce
  useEffect(() => {
    setDomainSuggestions([]);
    setDomainMessage("");

    const validationMessage = getDomainValidationMessage(domain);

    if (!domain) {
      setDomainStatus("idle");
      return;
    }

    if (validationMessage) {
      setDomainStatus("invalid");
      setDomainMessage(validationMessage);
      return;
    }

    setDomainStatus("checking");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        await checkDomainAvailability(domain, controller.signal);
        setDomainStatus("available");
        setDomainMessage(`${domain} is available`);
      } catch (error) {
        if (controller.signal.aborted) return;

        if (error instanceof DomainTakenError) {
          setDomainStatus("taken");
          setDomainMessage("That domain is taken.");
          setDomainSuggestions(error.suggestions);
          return;
        }

        if (error instanceof DomainCheckError) {
          setDomainStatus("invalid");
          setDomainMessage(
            error.apiError.fieldErrors?.domain ?? "That domain cannot be used.",
          );
          return;
        }

        setDomainStatus("idle");
        setDomainMessage("");
      }
    }, DOMAIN_CHECK_DELAY_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [domain]);

  const canContinue =
    restaurantName.trim().length > 0 &&
    domainStatus === "available" &&
    !iconError;

  function handleRestaurantNameChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setRestaurantName(event.target.value);
  }

  function handleDomainChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDomainEdited(true);
    setDomain(filterDomainInput(event.target.value));
  }

  function handleSuggestionClick(suggestion: string) {
    setDomainEdited(true);
    setDomain(filterDomainInput(suggestion));
  }

  function handleIconChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // User cancelled the file picker, leave existing icon untouched.
    if (!file) return;

    const error = getIconValidationMessage(file, ICON_MAX_BYTES, ICON_TYPES);

    if (error) {
      setIconFile(null);
      setIconError(error);
      event.target.value = "";
      return;
    }

    setIconFile(file);
    setIconError("");
  }

  function removeIcon() {
    setIconFile(null);
    setIconError("");
    setIconInputKey((k) => k + 1);
  }

  // Called by useSignupForm to mark domain as taken after a race-condition
  // conflict detected at final submission
  function markDomainTaken(suggestions: string[]) {
    setDomainStatus("taken");
    setDomainMessage("That domain is taken.");
    setDomainSuggestions(suggestions);
  }

  return {
    restaurantName,
    domain,
    domainStatus,
    domainMessage,
    domainSuggestions,
    iconFile,
    iconPreview,
    iconError,
    iconInputKey,
    canContinue,
    handleRestaurantNameChange,
    handleDomainChange,
    handleSuggestionClick,
    handleIconChange,
    removeIcon,
    markDomainTaken,
  };
}
