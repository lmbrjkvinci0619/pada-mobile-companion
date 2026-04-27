import React from "react";
import { View, Text } from "react-native";
import { cn } from "@/utils/cn";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "ghost"
  | "disc";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  default:  "bg-surface-overlay",
  primary:  "bg-primary-500/20 border border-primary-500/40",
  success:  "bg-accent/20 border border-accent/40",
  warning:  "bg-warning/20 border border-warning/40",
  danger:   "bg-danger/20 border border-danger/40",
  ghost:    "bg-transparent border border-surface-overlay",
  disc:     "bg-disc/20 border border-disc/40",
};

const textClass: Record<BadgeVariant, string> = {
  default: "text-txt-secondary",
  primary: "text-primary-300",
  success: "text-disc-light",
  warning: "text-warning",
  danger:  "text-danger-light",
  ghost:   "text-txt-secondary",
  disc:    "text-disc-light",
};

export function Badge({ label, variant = "default", size = "sm", className }: BadgeProps) {
  return (
    <View
      className={cn(
        "rounded-full items-center justify-center",
        size === "sm" ? "px-2.5 py-0.5" : "px-3.5 py-1",
        variantClass[variant],
        className,
      )}
    >
      <Text
        className={cn(
          "font-semi",
          size === "sm" ? "text-xs" : "text-sm",
          textClass[variant],
        )}
      >
        {label}
      </Text>
    </View>
  );
}
