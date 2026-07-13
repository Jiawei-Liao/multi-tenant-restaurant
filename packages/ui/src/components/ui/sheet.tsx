import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "../../lib/utils";

function Sheet(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

type SheetContentProps = DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  side?: "bottom" | "left" | "right";
};

const viewportClasses = {
  bottom: "items-end",
  left: "justify-start",
  right: "justify-end",
} as const;

const popupClasses = {
  bottom:
    "max-h-[85svh] w-full rounded-t-2xl border-t [padding-right:env(safe-area-inset-right,0px)] [padding-bottom:env(safe-area-inset-bottom,0px)] [padding-left:env(safe-area-inset-left,0px)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
  left: "h-full w-[min(85vw,280px)] border-r [padding-top:env(safe-area-inset-top,0px)] [padding-bottom:env(safe-area-inset-bottom,0px)] [padding-left:env(safe-area-inset-left,0px)] data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full",
  right:
    "h-full w-[min(85vw,360px)] border-l [padding-top:env(safe-area-inset-top,0px)] [padding-right:env(safe-area-inset-right,0px)] [padding-bottom:env(safe-area-inset-bottom,0px)] data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
} as const;

const closeButtonPositionClasses = {
  bottom: "top-3 right-[calc(0.75rem+env(safe-area-inset-right,0px))]",
  left: "top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3",
  right:
    "top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-[calc(0.75rem+env(safe-area-inset-right,0px))]",
} as const;

function SheetContent({
  children,
  className,
  showCloseButton = true,
  side = "right",
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/45 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
      <DialogPrimitive.Viewport
        className={cn(
          "pointer-events-none fixed inset-0 z-50 flex",
          viewportClasses[side],
        )}
      >
        <DialogPrimitive.Popup
          className={cn(
            "pointer-events-auto relative flex flex-col bg-background text-foreground shadow-lg outline-none transition-transform duration-200 motion-reduce:transition-none",
            popupClasses[side],
            className,
          )}
          data-slot="sheet-content"
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              aria-label="Close"
              className={cn(
                "absolute inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                closeButtonPositionClasses[side],
              )}
            >
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M18 6 6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-4 text-left", className)}
      data-slot="sheet-header"
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      data-slot="sheet-footer"
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("font-semibold text-foreground", className)}
      data-slot="sheet-title"
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
