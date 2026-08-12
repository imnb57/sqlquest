import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The chunky, pressable button that carries the app's tactile feel.
 * `3d` variants render a solid bottom edge that collapses on :active.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-extrabold tracking-wide select-none " +
    "disabled:pointer-events-none disabled:opacity-45 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none " +
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  {
    variants: {
      variant: {
        primary:
          "btn-3d bg-brand-600 text-white rounded-xl shadow-[0_4px_0_0_var(--color-brand-800)] hover:bg-brand-500 active:bg-brand-700",
        success:
          "btn-3d bg-success text-white rounded-xl shadow-[0_4px_0_0_oklch(0.55_0.16_145)] hover:brightness-110",
        danger:
          "btn-3d bg-danger text-white rounded-xl shadow-[0_4px_0_0_oklch(0.48_0.19_25)] hover:brightness-110",
        accent:
          "btn-3d bg-lime-accent-400 text-brand-950 rounded-xl shadow-[0_4px_0_0_var(--color-lime-accent-600)] hover:brightness-105",
        outline:
          "btn-3d border-2 border-border-strong bg-bg-elevated text-fg rounded-xl shadow-[0_4px_0_0_var(--border)] hover:bg-bg-subtle",
        secondary:
          "bg-bg-inset text-fg rounded-xl border border-border-base hover:bg-bg-subtle transition-colors",
        ghost:
          "text-fg-muted hover:text-fg hover:bg-bg-subtle rounded-xl transition-colors",
        link: "text-brand-500 underline-offset-4 hover:underline font-semibold",
      },
      size: {
        sm: "h-9 px-3.5 text-xs [&_svg]:size-4",
        md: "h-11 px-5 text-sm [&_svg]:size-4.5",
        lg: "h-13 px-7 text-base [&_svg]:size-5",
        xl: "h-15 px-9 text-lg [&_svg]:size-5.5",
        icon: "size-10 [&_svg]:size-5",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
      full: { true: "w-full", false: "" },
      uppercase: { true: "uppercase", false: "" },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      full: false,
      uppercase: false,
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  full,
  uppercase,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, full, uppercase }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
