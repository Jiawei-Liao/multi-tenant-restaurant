const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFirstName(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "First name is required.";
  }

  if (trimmed.length > 100) {
    return "Use 100 characters or fewer.";
  }

  return undefined;
}

export function validateEmail(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Enter a valid email address.";
  }

  return undefined;
}

export function validatePassword(value: string) {
  if (!value) {
    return "Password is required.";
  }

  if (value.length < 8) {
    return "Use at least 8 characters.";
  }

  return undefined;
}
