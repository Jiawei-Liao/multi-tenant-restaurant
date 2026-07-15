import * as React from "react"

import { cn } from "../../lib/utils"

interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * When true, applies destructive border styling to signal a field error.
   */
  error?: boolean;
}

/**
 * A wrapper that takes ownership of the border/focus ring for composite
 * inputs (e.g. password + toggle button, subdomain + suffix + status icon).
 *
 * Any `<Input>` placed inside automatically strips its own border, shadow,
 * and focus ring via the `in-data-[slot=input-group]:*` selectors in
 * `input.tsx`, so no extra className is needed on the inner input.
 */
function InputGroup({ className, error, children, ...props }: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      {...(error ? { "data-error": "" } : {})}
      className={cn(
        "flex items-center overflow-hidden",
        "border border-input rounded-lg bg-background",
        "transition-[border-color,box-shadow] duration-[160ms] ease-[ease]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20",
        "data-[error]:border-destructive data-[error]:ring-[3px] data-[error]:ring-destructive/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { InputGroup }
