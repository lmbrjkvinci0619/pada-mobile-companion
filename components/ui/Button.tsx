import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from "react-native";
import { cn } from "@/utils/cn";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  label: string;
  icon?: React.ReactNode;
}

const variantClass: Record<string, string> = {
  primary: "bg-primary-500 active:bg-primary-600",
  secondary: "bg-surface-raised border border-surface-overlay active:bg-surface-overlay",
  ghost: "bg-transparent active:bg-surface-raised",
  danger: "bg-danger active:bg-danger-dark",
  success: "bg-accent active:bg-accent-dark",
};

const textClass: Record<string, string> = {
  primary: "text-white font-semi",
  secondary: "text-txt-primary font-semi",
  ghost: "text-primary font-semi",
  danger: "text-white font-semi",
  success: "text-white font-semi",
};

const sizeClass: Record<string, string> = {
  sm: "px-3 py-1.5 rounded-xl",
  md: "px-5 py-3 rounded-2xl",
  lg: "px-6 py-4 rounded-2xl",
};

const textSizeClass: Record<string, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  label,
  icon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      {...props}
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center gap-2",
        variantClass[variant],
        sizeClass[size],
        (disabled || loading) && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "ghost" || variant === "secondary" ? "#1E88E5" : "#fff"}
        />
      ) : (
        icon
      )}
      <Text className={cn(textClass[variant], textSizeClass[size])}>{label}</Text>
    </TouchableOpacity>
  );
}
