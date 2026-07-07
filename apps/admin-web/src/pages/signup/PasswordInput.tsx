import { Eye, EyeOff } from "lucide-react";
import { Input, InputGroup } from "@multi-tenant-restaurant/ui";
import signup from "./Signup.module.css";
import passwordInput from "./PasswordInput.module.css";

type PasswordInputProps = {
  id?: string;
  value: string;
  show: boolean;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  onChange: (value: string) => void;
  onToggle: () => void;
};

function PasswordInput({
  id = "password-input",
  value,
  show,
  placeholder,
  autoComplete,
  error = "",
  onChange,
  onToggle,
}: PasswordInputProps) {
  const Icon = show ? EyeOff : Eye;

  return (
    <>
      <InputGroup error={!!error}>
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(event: any) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className={passwordInput.toggle}
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          <Icon aria-hidden="true" />
        </button>
      </InputGroup>
      {error && (
        <span
          id={`${id}-error`}
          className={`${signup.helper} ${signup.error}`}
          role="alert"
        >
          {error}
        </span>
      )}
    </>
  );
}

export default PasswordInput;
