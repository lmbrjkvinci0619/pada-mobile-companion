import React from "react";
import { View, TouchableOpacity, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Section, Eyebrow } from "./Typography";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: (() => void) | true;
  right?: React.ReactNode;
  large?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  back,
  right,
  large = false,
  className,
}: PageHeaderProps) {
  const handleBack = () => {
    if (typeof back === "function") back();
    else router.back();
  };
  return (
    <View className={cn("px-5 pt-3 pb-3 bg-bg border-b border-surface-border", className)}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {back && (
            <TouchableOpacity onPress={handleBack} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="mr-3 w-10 h-10 items-center justify-center">
              <Ionicons name="chevron-back" size={26} color="#000000" />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Section numberOfLines={1} className={large ? "text-[40px]" : undefined}>
              {title}
            </Section>
            {subtitle && (
              <Eyebrow tone="secondary" className="mt-1">
                {subtitle}
              </Eyebrow>
            )}
          </View>
        </View>
        {right}
      </View>
    </View>
  );
}

export function Divider({ className }: { className?: string }) {
  return <View className={cn("h-px bg-surface-border w-full", className)} />;
}

export function IconChip({
  name,
  color = "#000000",
  background,
  size = 18,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <View
      className="w-9 h-9 items-center justify-center border border-surface-border"
      style={background ? { backgroundColor: background } : undefined}
    >
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export function SectionLabel({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("flex-row items-center justify-between mb-3", className)}>
      <View className="flex-row items-center gap-2">
        <View className="w-1 h-3.5 bg-primary" />
      <Eyebrow tone="primary">{children}</Eyebrow>
      </View>
      {action}
    </View>
  );
}