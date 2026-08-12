"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Switch, Label } from "@/components/ui/form-controls";

/**
 * Shared layout pieces for the settings screens: a titled section, and a row
 * that pairs a label + description with any control.
 */

export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="border-b border-border-base px-5 py-4">
        <h2 className="text-base font-extrabold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
        )}
      </div>
      <div className="divide-y divide-border-base">{children}</div>
    </Card>
  );
}

export function SettingsRow({
  label,
  description,
  htmlFor,
  control,
  children,
  stacked,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  /** Right-aligned control (switch, select…). */
  control?: React.ReactNode;
  /** Full-width content rendered under the label. */
  children?: React.ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-5 py-4",
        !stacked && control && "flex items-center justify-between gap-6",
      )}
    >
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="text-sm">
          {label}
        </Label>
        {description && (
          <p className="mt-0.5 text-sm leading-relaxed text-fg-muted">
            {description}
          </p>
        )}
      </div>

      {control && <div className="shrink-0">{control}</div>}
      {children && <div className={cn(control ? "mt-3" : "mt-3")}>{children}</div>}
    </div>
  );
}

/** Convenience wrapper for the very common label + switch pairing. */
export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SettingsRow
      label={label}
      description={description}
      htmlFor={id}
      control={
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={label}
        />
      }
    />
  );
}
