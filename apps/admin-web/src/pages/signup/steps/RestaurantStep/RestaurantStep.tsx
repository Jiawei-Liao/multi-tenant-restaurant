import { Check, ImagePlus, LoaderCircle, X } from "lucide-react";
import { Input, InputGroup } from "@multi-tenant-restaurant/ui";
import { Button } from "@multi-tenant-restaurant/ui";
import signup from "../../Signup.module.css";
import restaurantStep from "./RestaurantStep.module.css";
import { DOMAIN_SUFFIX } from "@/config";
import type { useRestaurantStep } from "./useRestaurantStep";

type RestaurantStepProps = {
  form: ReturnType<typeof useRestaurantStep>;
  canContinue: boolean;
  onContinue: () => void;
};

function RestaurantStep({
  form,
  canContinue,
  onContinue,
}: RestaurantStepProps) {
  const {
    restaurantName,
    domain,
    domainStatus,
    domainMessage,
    domainSuggestions,
    iconFile,
    iconPreview,
    iconError,
    iconInputKey,
    handleRestaurantNameChange,
    handleDomainChange,
    handleSuggestionClick,
    handleIconChange,
    removeIcon,
  } = form;

  return (
    <section aria-labelledby="restaurant-step-title">
      <div className={signup.fields}>
        {/* Restaurant name */}
        <label className={signup.field}>
          <span>Restaurant name</span>
          <Input
            value={restaurantName}
            onChange={handleRestaurantNameChange}
            autoComplete="organization"
            placeholder="DEMOno's"
          />
        </label>

        {/* Domain */}
        <div className={signup.field}>
          <label htmlFor="domain">Domain</label>
          <InputGroup
            error={domainStatus === "taken" || domainStatus === "invalid"}
          >
            <Input
              id="domain"
              value={domain}
              onChange={handleDomainChange}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="domain-message"
            />
            <span className={restaurantStep.suffix}>{DOMAIN_SUFFIX}</span>
            <span className={restaurantStep.status} aria-hidden="true">
              {domainStatus === "checking" && (
                <LoaderCircle className={signup.spinner} />
              )}
              {domainStatus === "available" && (
                <Check style={{ color: "var(--success)" }} />
              )}
              {(domainStatus === "taken" || domainStatus === "invalid") && (
                <X style={{ color: "var(--destructive)" }} />
              )}
            </span>
          </InputGroup>
          <p
            id="domain-message"
            className={`${signup.helper} ${
              domainStatus === "available" ? signup.success : ""
            } ${
              domainStatus === "taken" || domainStatus === "invalid"
                ? signup.error
                : ""
            }`}
          >
            {domainMessage}
          </p>
          {domainSuggestions.length > 0 && (
            <div
              className={restaurantStep.suggestions}
              aria-label="Suggestions"
            >
              {domainSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Icon upload */}
        <div className={signup.field}>
          <span>Icon</span>
          <div className={restaurantStep.iconGroup}>
            <label className={restaurantStep.iconUpload}>
              <input
                key={iconInputKey}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleIconChange}
              />
              {iconPreview ? (
                <img src={iconPreview} alt="" />
              ) : (
                <ImagePlus aria-hidden="true" />
              )}
            </label>
            {iconFile && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={removeIcon}
              >
                Remove
              </Button>
            )}
          </div>
          <p className={`${signup.helper} ${iconError ? signup.error : ""}`}>
            {iconError || "Optional. PNG, JPEG, or WebP up to 1 MB."}
          </p>
        </div>
      </div>

      <Button
        className={signup.primaryButton}
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continue
      </Button>
    </section>
  );
}

export default RestaurantStep;
