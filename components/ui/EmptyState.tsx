import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import { useColors, type ColorKey } from "@/lib/tokens";
import { Section, Body as TBody } from "./Typography";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  accent?: "muted" | "primary" | "secondary" | "warning";
  className?: string;
}

const ACCENT_KEY: Record<NonNullable<EmptyStateProps["accent"]>, ColorKey> = {
  muted: "txtMuted",
  primary: "primary",
  secondary: "secondary",
  warning: "warning",
};

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  subtitle,
  accent = "muted",
  className,
}: EmptyStateProps) {
  const colors = useColors();
  const color = colors[ACCENT_KEY[accent]];
  return (
    <View
      className={cn(
        "bg-surface border border-surface-border py-10 px-6 items-center gap-3",
        className,
      )}
    >
      <View className="w-12 h-12 items-center justify-center border border-surface-border bg-surface-raised">
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Section tone="primary" size="sm" className="text-center">
        {title}
      </Section>
      {subtitle && (
        <TBody tone="secondary" className="text-sm text-center max-w-[260px]">
          {subtitle}
        </TBody>
      )}
    </View>
  );
});