import React from "react";
import { View, Text } from "react-native";
import { cn } from "@/utils/cn";

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
  primary:   "bg-surface-overlay border border-primary text-primary",
  secondary: "bg-surface-overlay border border-secondary text-secondary",
  success:   "bg-surface-overlay border border-success text-success",
  warning:   "bg-surface-overlay border border-warning text-warning",
  danger:    "bg-surface-overlay border border-danger text-danger",
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
  return (
    <View
      className={cn(
        "items-center justify-center self-start",
        size === "sm" ? "px-2 py-0.5" : "px-3 py-1",
        isAccent ? containerVariant.primary : containerVariant[variant],
        className,
      )}
      style={isAccent ? { borderColor: accent } : undefined}
    >
      <Text
        className={cn(
          "font-semibold uppercase tracking-[0.12em]",
          size === "sm" ? "text-[10px]" : "text-xs",
          isAccent ? "" : (variant === "default" || variant === "ghost" ? "text-txt-secondary" : ""),
        )}
        style={isAccent ? { color: accent } : undefined}
      >
        {label}
      </Text>
    </View>
  );
});