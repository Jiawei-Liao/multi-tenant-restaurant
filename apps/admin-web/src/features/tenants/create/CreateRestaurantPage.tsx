import { useRef, useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ImagePlus,
  LoaderCircle,
  X,
} from "lucide-react";
import { Button, Input, InputGroup } from "@multi-tenant-restaurant/ui";
import { toast } from "sonner";
import { useAuth, getTenantHomePath } from "@/features/auth";
import { DOMAIN_SUFFIX } from "@/config";
import { APP_PATHS } from "@/shared/routePaths";
import {
  completeRestaurantCreation,
  initiateRestaurantCreation,
  RestaurantApiError,
  uploadRestaurantIcon,
  type InitiateRestaurantCreationResponse,
} from "./createRestaurantApi";
import { ICON_TYPES } from "./createRestaurantValidation";
import { useCreateRestaurantForm } from "./useCreateRestaurantForm";
import styles from "./CreateRestaurantPage.module.css";

type PreparedCreation = InitiateRestaurantCreationResponse & {
  subdomain: string;
  iconFile: File | null;
  iconUploaded: boolean;
  name: string;
};

function CreateRestaurantPage() {
  const navigate = useNavigate();
  const { currentTenant, retry, selectTenant } = useAuth();
  const form = useCreateRestaurantForm();
  const preparedCreationRef = useRef<PreparedCreation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRestaurantId, setCreatedRestaurantId] = useState<string | null>(
    null,
  );
  const [pageError, setPageError] = useState("");
  const cancelPath = currentTenant
    ? getTenantHomePath(currentTenant)
    : APP_PATHS.onboarding;
  const isFormLocked = isSubmitting || createdRestaurantId !== null;
  const hasSubdomainError = ["taken", "invalid", "error"].includes(
    form.subdomainStatus,
  );

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    if (isSubmitting || createdRestaurantId) {
      return;
    }

    if (!form.canSubmit) {
      form.touchRequiredFields();
      return;
    }

    const name = form.restaurantName.trim();
    const { subdomain, iconFile } = form;
    setIsSubmitting(true);
    setPageError("");

    try {
      let prepared = preparedCreationRef.current;

      if (!matchesForm(prepared, name, subdomain, iconFile)) {
        const initiation = await initiateRestaurantCreation({
          subdomain,
          name,
          iconContentType: iconFile?.type ?? null,
          iconSizeBytes: iconFile?.size ?? null,
        });
        prepared = {
          ...initiation,
          subdomain,
          iconFile,
          iconUploaded: false,
          name,
        };
        preparedCreationRef.current = prepared;
      }

      if (iconFile && !prepared.iconUploadUrl) {
        throw new RestaurantApiError(
          502,
          "INVALID_API_RESPONSE",
          "The server did not provide an icon upload URL.",
        );
      }

      if (iconFile && prepared.iconUploadUrl && !prepared.iconUploaded) {
        await uploadRestaurantIcon(prepared.iconUploadUrl, iconFile);
        prepared.iconUploaded = true;
      }

      const createdRestaurant = await completeRestaurantCreation({
        tenantId: prepared.tenantId,
        subdomain,
        name,
        iconContentType: iconFile?.type ?? null,
      });
      preparedCreationRef.current = null;
      setCreatedRestaurantId(createdRestaurant.id);
      toast.success("Restaurant created.");

      if (!(await openRestaurant(createdRestaurant.id))) {
        setPageError(
          "Your restaurant was created, but it could not be opened automatically. Try opening it again.",
        );
      }
    } catch (error) {
      handleCreationError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOpenCreatedRestaurant() {
    if (!createdRestaurantId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setPageError("");

    if (!(await openRestaurant(createdRestaurantId))) {
      setPageError(
        "The restaurant still could not be opened. Check your connection and try again.",
      );
      setIsSubmitting(false);
    }
  }

  async function openRestaurant(tenantId: string) {
    try {
      await retry();
      const tenant = await selectTenant(tenantId);
      navigate(getTenantHomePath(tenant), { replace: true });
      return true;
    } catch {
      return false;
    }
  }

  function handleCreationError(error: unknown) {
    if (error instanceof RestaurantApiError) {
      if (error.code === "SUBDOMAIN_TAKEN") {
        preparedCreationRef.current = null;
        form.markSubdomainTaken(getSuggestions(error.details));
        return;
      }

      if (error.code === "NAME_TAKEN") {
        preparedCreationRef.current = null;
        form.markNameTaken();
        return;
      }

      if (
        error.code === "ICON_TOO_LARGE" ||
        error.code === "ICON_TYPE_NOT_ALLOWED" ||
        error.code === "ICON_UPLOAD_MISSING" ||
        error.code === "ICON_UPLOAD_INVALID"
      ) {
        preparedCreationRef.current = null;
      }
    }

    setPageError(getCreationErrorMessage(error));
  }

  return (
    <div className={styles.page}>
      <section className={styles.content} aria-labelledby="create-title">
        <Link className={styles.backLink} to={cancelPath}>
          <ArrowLeft aria-hidden="true" />
          Back
        </Link>

        <div className={styles.heading}>
          <h1 id="create-title">Create a restaurant</h1>
          <p>Let's set up your restaurant's identity.</p>
        </div>

        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          {pageError && (
            <div className={styles.alert} role="alert">
              <AlertCircle aria-hidden="true" />
              <span>{pageError}</span>
              <button
                aria-label="Dismiss error"
                type="button"
                onClick={() => setPageError("")}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          )}

          <label className={styles.field}>
            <span className={styles.labelText}>
              Restaurant name <span className={styles.required}>*</span>
            </span>
            <Input
              aria-describedby={
                form.nameError ? "restaurant-name-error" : undefined
              }
              aria-invalid={!!form.nameError}
              autoComplete="organization"
              className={styles.textInput}
              disabled={isFormLocked}
              maxLength={255}
              placeholder="e.g. WcDonald's"
              value={form.restaurantName}
              onBlur={form.touchName}
              onChange={form.handleRestaurantNameChange}
            />
            {form.nameError && (
              <span
                className={`${styles.helper} ${styles.error}`}
                id="restaurant-name-error"
                role="alert"
              >
                {form.nameError}
              </span>
            )}
          </label>

          <div className={styles.field}>
            <label className={styles.labelText} htmlFor="restaurant-subdomain">
              Subdomain <span className={styles.required}>*</span>
            </label>
            <InputGroup
              className={styles.subdomainInput}
              error={hasSubdomainError}
            >
              <Input
                aria-describedby="restaurant-subdomain-message"
                aria-invalid={hasSubdomainError}
                autoComplete="off"
                disabled={isFormLocked}
                id="restaurant-subdomain"
                maxLength={63}
                spellCheck={false}
                value={form.subdomain}
                onBlur={form.touchSubdomain}
                onChange={form.handleSubdomainChange}
              />
              {DOMAIN_SUFFIX && (
                <span className={styles.domainSuffix}>{DOMAIN_SUFFIX}</span>
              )}
              <span className={styles.subdomainStatus} aria-hidden="true">
                {form.subdomainStatus === "checking" && (
                  <LoaderCircle className={styles.spinner} />
                )}
                {form.subdomainStatus === "available" && (
                  <Check className={styles.availableIcon} />
                )}
                {hasSubdomainError && <X className={styles.errorIcon} />}
              </span>
            </InputGroup>
            <p
              className={`${styles.helper} ${
                form.subdomainStatus === "available" ? styles.success : ""
              } ${hasSubdomainError ? styles.error : ""}`}
              id="restaurant-subdomain-message"
            >
              {form.subdomainMessage ||
                "This becomes your restaurant's customer-facing address."}
            </p>
            {form.subdomainSuggestions.length > 0 && (
              <div
                className={styles.suggestions}
                aria-label="Subdomain suggestions"
              >
                {form.subdomainSuggestions.map((suggestion) => (
                  <button
                    disabled={isFormLocked}
                    key={suggestion}
                    type="button"
                    onClick={() => form.handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <span className={styles.labelText}>
              Icon <span className={styles.optional}>(optional)</span>
            </span>
            <div className={styles.iconRow}>
              <label className={styles.iconUpload}>
                <input
                  accept={[...ICON_TYPES].join(",")}
                  aria-label={
                    form.iconFile
                      ? "Replace restaurant icon"
                      : "Add restaurant icon"
                  }
                  disabled={isFormLocked}
                  key={form.iconInputKey}
                  type="file"
                  onChange={form.handleIconChange}
                />
                {form.iconPreview ? (
                  <img alt="" src={form.iconPreview} />
                ) : (
                  <ImagePlus aria-hidden="true" />
                )}
              </label>
              {form.iconFile && (
                <Button
                  disabled={isFormLocked}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={form.removeIcon}
                >
                  Remove
                </Button>
              )}
            </div>
            <p
              className={`${styles.helper} ${form.iconError ? styles.error : ""}`}
              role={form.iconError ? "alert" : undefined}
            >
              {form.iconError || "PNG, JPEG, or WebP up to 1 MB."}
            </p>
          </div>

          <div className={styles.actions}>
            <Button
              className={styles.cancelButton}
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => navigate(cancelPath)}
            >
              Cancel
            </Button>
            {createdRestaurantId ? (
              <Button
                className={styles.submitButton}
                disabled={isSubmitting}
                type="button"
                onClick={() => void handleOpenCreatedRestaurant()}
              >
                {isSubmitting && <LoaderCircle className={styles.spinner} />}
                {isSubmitting ? "Opening restaurant…" : "Open restaurant"}
              </Button>
            ) : (
              <Button
                className={styles.submitButton}
                disabled={!form.canSubmit || isSubmitting}
                type="submit"
              >
                {isSubmitting && <LoaderCircle className={styles.spinner} />}
                {isSubmitting ? "Creating restaurant…" : "Create restaurant"}
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function matchesForm(
  prepared: PreparedCreation | null,
  name: string,
  subdomain: string,
  iconFile: File | null,
): prepared is PreparedCreation {
  return (
    prepared !== null &&
    prepared.name === name &&
    prepared.subdomain === subdomain &&
    prepared.iconFile === iconFile
  );
}

function getSuggestions(details: unknown) {
  return Array.isArray(details)
    ? details.filter((value): value is string => typeof value === "string")
    : [];
}

function getCreationErrorMessage(error: unknown) {
  if (error instanceof RestaurantApiError) {
    if (error.code === "ICON_TOO_LARGE") {
      return "Use an icon smaller than 1 MB.";
    }

    if (error.code === "ICON_TYPE_NOT_ALLOWED") {
      return "Use a PNG, JPEG, or WebP image.";
    }

    if (error.code === "ICON_UPLOAD_MISSING") {
      return "The icon upload did not finish. Try creating the restaurant again.";
    }

    if (error.code === "ICON_UPLOAD_INVALID") {
      return "The uploaded icon is empty. Choose another image and try again.";
    }

    if (error.code === "VALIDATION_ERROR") {
      return "Check the restaurant details and try again.";
    }

    if (error.code === "INVALID_API_RESPONSE") {
      return "The restaurant service returned an unexpected response. Try again.";
    }

    if (error.status === 401 || error.status === 403) {
      return "Your session no longer permits this action. Sign in and try again.";
    }
  }

  return "Could not create the restaurant. Check your connection and try again.";
}

export default CreateRestaurantPage;
