import React from "react";
import { View, Text, Image } from "react-native";
import { cn } from "@/utils/cn";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { container: "w-7 h-7 rounded-full",  text: "text-xs" },
  sm: { container: "w-9 h-9 rounded-full",  text: "text-sm" },
  md: { container: "w-12 h-12 rounded-full", text: "text-base" },
  lg: { container: "w-16 h-16 rounded-full", text: "text-xl" },
  xl: { container: "w-24 h-24 rounded-full", text: "text-3xl" },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name[0].toUpperCase();
}

const COLORS = [
  "bg-primary-500",
  "bg-accent",
  "bg-warning",
  "bg-disc-dark",
  "bg-primary-700",
];

function seedColor(name?: string): string {
  if (!name) return COLORS[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) ?? 0);
  return COLORS[code % COLORS.length];
}

export function Avatar({ uri, name, size = "md", className }: AvatarProps) {
  const { container, text } = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={cn(container, className)}
      />
    );
  }

  return (
    <View
      className={cn(
        container,
        seedColor(name),
        "items-center justify-center",
        className,
      )}
    >
      <Text className={cn("text-white font-bold", text)}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
