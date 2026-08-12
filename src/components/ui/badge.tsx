import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-500/12 text-brand-600 dark:text-brand-300",
        neutral: "bg-bg-inset text-fg-muted border border-border-base",
        success: "bg-success/14 text-success",
        warning: "bg-warning/16 text-warning",
        danger: "bg-danger/14 text-danger",
        aqua: "bg-aqua-500/14 text-aqua-600 dark:text-aqua-300",
        xp: "bg-xp/18 text-xp-dark dark:text-xp",
        streak: "bg-streak/16 text-streak",
        solid: "bg-brand-600 text-white",
        outline: "border-2 border-border-strong text-fg-muted",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3.5 py-1.5 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

function Badge({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
