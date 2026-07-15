import { useEffect, useState, type ChangeEvent } from "react";
import {
  checkSubdomainAvailability,
  RestaurantApiError,
} from "./createRestaurantApi";
import {
  createSubdomainFromName,
  filterSubdomainInput,
  getIconValidationMessage,
  getRestaurantNameValidationMessage,
  getSubdomainValidationMessage,
  SUBDOMAIN_CHECK_DELAY_MS,
  type SubdomainStatus,
} from "./createRestaurantValidation";

type AvailabilityStatus = SubdomainStatus | "error";

export function useCreateRestaurantForm() {
  const [restaurantName, setRestaurantName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [subdomainStatus, setSubdomainStatus] =
    useState<AvailabilityStatus>("idle");
  const [subdomainMessage, setSubdomainMessage] = useState("");
  const [subdomainSuggestions, setSubdomainSuggestions] = useState<string[]>(
    [],
  );
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconError, setIconError] = useState("");
  const [iconInputKey, setIconInputKey] = useState(0);
  const [isNameTouched, setIsNameTouched] = useState(false);
  const [isSubdomainTouched, setIsSubdomainTouched] = useState(false);
  const [serverNameError, setServerNameError] = useState("");

  useEffect(() => {
    if (!subdomainEdited) {
      setSubdomain(createSubdomainFromName(restaurantName));
    }
  }, [restaurantName, subdomainEdited]);

  useEffect(() => {
    if (!iconFile) {
      setIconPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(iconFile);
    setIconPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [iconFile]);

  useEffect(() => {
    setSubdomainSuggestions([]);

    if (!subdomain) {
      setSubdomainStatus(isSubdomainTouched ? "invalid" : "idle");
      setSubdomainMessage(
        isSubdomainTouched ? getSubdomainValidationMessage(subdomain) : "",
      );
      return;
    }

    const validationMessage = getSubdomainValidationMessage(subdomain);

    if (validationMessage) {
      setSubdomainStatus("invalid");
      setSubdomainMessage(validationMessage);
      return;
    }

    setSubdomainStatus("checking");
    setSubdomainMessage("Checking availability…");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void checkSubdomainAvailability(subdomain, controller.signal)
        .then((result) => {
          if (result.available) {
            setSubdomainStatus("available");
            setSubdomainMessage(`${subdomain} is available.`);
            return;
          }

          setSubdomainStatus("taken");
          setSubdomainMessage("That subdomain is already taken.");
          setSubdomainSuggestions(result.suggestions);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          if (
            error instanceof RestaurantApiError &&
            error.code === "VALIDATION_ERROR"
          ) {
            setSubdomainStatus("invalid");
            setSubdomainMessage(error.message);
            return;
          }

          setSubdomainStatus("error");
          setSubdomainMessage("Could not check availability. Try again.");
        });
    }, SUBDOMAIN_CHECK_DELAY_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isSubdomainTouched, subdomain]);

  const clientNameError = getRestaurantNameValidationMessage(restaurantName);
  const nameError = serverNameError || (isNameTouched ? clientNameError : "");
  const canSubmit =
    !clientNameError && subdomainStatus === "available" && !iconError;

  function handleRestaurantNameChange(event: ChangeEvent<HTMLInputElement>) {
    setRestaurantName(event.target.value);
    setServerNameError("");
  }

  function handleSubdomainChange(event: ChangeEvent<HTMLInputElement>) {
    setSubdomainEdited(true);
    setIsSubdomainTouched(true);
    setSubdomain(filterSubdomainInput(event.target.value));
  }

  function handleSuggestionClick(suggestion: string) {
    setSubdomainEdited(true);
    setIsSubdomainTouched(true);
    setSubdomain(filterSubdomainInput(suggestion));
  }

  function handleIconChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationMessage = getIconValidationMessage(file);

    if (validationMessage) {
      setIconFile(null);
      setIconError(validationMessage);
      event.target.value = "";
      return;
    }

    setIconFile(file);
    setIconError("");
  }

  function removeIcon() {
    setIconFile(null);
    setIconError("");
    setIconInputKey((current) => current + 1);
  }

  function touchRequiredFields() {
    setIsNameTouched(true);
    setIsSubdomainTouched(true);
  }

  function markSubdomainTaken(suggestions: string[]) {
    setIsSubdomainTouched(true);
    setSubdomainStatus("taken");
    setSubdomainMessage("That subdomain is already taken.");
    setSubdomainSuggestions(suggestions);
  }

  function markNameTaken() {
    setIsNameTouched(true);
    setServerNameError("That restaurant name is already in use.");
  }

  return {
    restaurantName,
    subdomain,
    subdomainStatus,
    subdomainMessage,
    subdomainSuggestions,
    iconFile,
    iconPreview,
    iconError,
    iconInputKey,
    nameError,
    canSubmit,
    handleRestaurantNameChange,
    handleSubdomainChange,
    handleSuggestionClick,
    handleIconChange,
    removeIcon,
    touchRequiredFields,
    markSubdomainTaken,
    markNameTaken,
    touchName: () => setIsNameTouched(true),
    touchSubdomain: () => setIsSubdomainTouched(true),
  };
}
