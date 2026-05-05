import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { cn } from "@/utils/cn";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  border?: boolean;
}

const sizeMap = {
  xs: { container: "w-7 h-7",  text: "text-xs" },
  sm: { container: "w-9 h-9",  text: "text-sm" },
  md: { container: "w-12 h-12", text: "text-base" },
  lg: { container: "w-16 h-16", text: "text-xl" },
  xl: { container: "w-24 h-24", text: "text-3xl" },
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
  "bg-surface-overlay",
  "bg-primary-700",
];

function seedColor(name?: string): string {
  if (!name) return COLORS[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) ?? 0);
  return COLORS[code % COLORS.length];
}

export const Avatar = React.memo(function Avatar({ uri, name, size = "md", className, border = false }: AvatarProps) {
  const { container, text } = sizeMap[size];

  const commonClasses = cn(
    container,
    "rounded-full overflow-hidden",
    border && "border-2 border-surface-border",
    className
  );

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={commonClasses}
        transition={200}
        contentFit="cover"
        cachePolicy="disk"
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        onError={() => console.warn("Failed to load avatar image:", uri)}
        recyclingKey={uri}
      />
    );
  }

  return (
    <View
      className={cn(
        commonClasses,
        seedColor(name),
        "items-center justify-center",
      )}
    >
      <Text className={cn("text-white font-bold", text)}>
        {getInitials(name)}
      </Text>
    </View>
  );
});

