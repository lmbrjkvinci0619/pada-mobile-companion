import React from "react";
import { View, Text, TouchableOpacity, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

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
    <View className={cn("px-5 pt-3 pb-3 bg-bg border-b-2 border-surface-border", className)}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {back && (
            <TouchableOpacity onPress={handleBack} activeOpacity={0.7} className="mr-3 w-10 h-10 items-center justify-center">
              <Ionicons name="chevron-back" size={26} color="#000000" />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className={cn(
                "text-txt-primary font-light lowercase tracking-tight leading-tight",
                large ? "text-[40px]" : "text-[28px]",
              )}
            >
              {title}
            </Text>
            {subtitle && (
              <Text className="text-txt-secondary text-[11px] font-semibold uppercase tracking-[0.2em] mt-1">
                {subtitle}
              </Text>
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
      className="w-9 h-9 items-center justify-center border-2 border-surface-border"
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
        <Text className="text-txt-primary text-[11px] font-semibold uppercase tracking-[0.2em]">
          {children}
        </Text>
      </View>
      {action}
    </View>
  );
}