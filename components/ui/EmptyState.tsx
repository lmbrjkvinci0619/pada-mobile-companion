import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import { Section, Body } from "./Typography";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  accent?: "muted" | "primary" | "secondary" | "warning";
  className?: string;
}

const ACCENT_ICON: Record<NonNullable<EmptyStateProps["accent"]>, string> = {
  muted: "#8A8A8A",
  primary: "#00ABA9",
  secondary: "#1BA1E2",
  warning: "#F09609",
};

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  subtitle,
  accent = "muted",
  className,
}: EmptyStateProps) {
  const color = ACCENT_ICON[accent];
  return (
    <View className={cn("bg-surface border border-surface-border py-10 px-6 items-center gap-3", className)}>
      <View className="w-12 h-12 items-center justify-center border border-surface-border bg-surface-raised">
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Section tone="primary" size="sm" className="text-center">
        {title}
      </Section>
      {subtitle && (
        <Body tone="secondary" className="text-sm text-center max-w-[260px]">
          {subtitle}
        </Body>
      )}
    </View>
  );
});
