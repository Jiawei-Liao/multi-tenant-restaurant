import { Eye, EyeOff } from "lucide-react";
import { Input, InputGroup } from "@multi-tenant-restaurant/ui";
import { useState, type ChangeEvent, type FocusEvent } from "react";
import styles from "./PasswordInput.module.css";

type PasswordInputProps = {
  id?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  ariaDescribedBy?: string;
  showErrorMessage?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
};

function PasswordInput({
  id = "password-input",
  value,
  placeholder,
  autoComplete,
  error = "",
  ariaDescribedBy,
  showErrorMessage = true,
  required = false,
  onChange,
  onBlur,
  onFocus,
}: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const Icon = isPasswordVisible ? EyeOff : Eye;
  const describedBy = [error ? `${id}-error` : null, ariaDescribedBy]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <InputGroup error={!!error}>
        <Input
          id={id}
          type={isPasswordVisible ? "text" : "password"}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          onBlur={onBlur}
          onFocus={onFocus}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setIsPasswordVisible((current) => !current)}
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          aria-pressed={isPasswordVisible}
        >
          <Icon aria-hidden="true" />
        </button>
      </InputGroup>
      {error && showErrorMessage && (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </>
  );
}

export default PasswordInput;
