import React from "react";
import { View } from "react-native";
import { cn } from "@/utils/cn";
import { EyebrowTight } from "./Typography";

type Variant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "ghost";

interface BadgeProps {
  label: string;
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
  accent?: string;
}

const containerVariant: Record<Variant, string> = {
  default:   "bg-surface-overlay border border-surface-border",
  primary:   "bg-surface-overlay border border-primary",
  secondary: "bg-surface-overlay border border-secondary",
  success:   "bg-surface-overlay border border-success",
  warning:   "bg-surface-overlay border border-warning",
  danger:    "bg-surface-overlay border border-danger",
  ghost:     "bg-transparent border border-surface-border",
};

export const Badge = React.memo(function Badge({
  label,
  variant = "default",
  size = "sm",
  className,
  accent,
}: BadgeProps) {
  const isAccent = !!accent;
  const tone =
    isAccent
      ? "primary"
      : variant === "default" || variant === "ghost"
        ? "secondary"
        : "primary";
  return (
    <View
      className={cn(
        "items-center justify-center self-start",
        size === "sm" ? "px-2 py-0.5" : "px-3 py-1",
        isAccent ? containerVariant.primary : containerVariant[variant],
        className,
      )}
      style={
        isAccent
          ? { borderColor: accent }
          : undefined
      }
    >
      <EyebrowTight
        className={cn(size === "sm" ? "text-[10px]" : "text-[11px]")}
        style={isAccent ? { color: accent } : undefined}
        tone={tone}
      >
        {label}
      </EyebrowTight>
    </View>
  );
});