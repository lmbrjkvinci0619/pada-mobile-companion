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
  accent?: string;
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

const FALLBACK_FILLS = [
  "#00ABA9",
  "#1BA1E2",
  "#339933",
  "#F09609",
  "#D80073",
  "#A200FF",
];

function seedColor(name?: string): string {
  if (!name) return FALLBACK_FILLS[0];
  let code = 0;
  for (let i = 0; i < name.length; i++) code += name.charCodeAt(i);
  return FALLBACK_FILLS[code % FALLBACK_FILLS.length] ?? FALLBACK_FILLS[0];
}

export const Avatar = React.memo(function Avatar({
  uri,
  name,
  size = "md",
  className,
  border = false,
  accent,
}: AvatarProps) {
  const { container, text } = sizeMap[size];

  const commonClasses = cn(
    container,
    "overflow-hidden",
    border && "border border-surface-border",
    className,
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
      className={cn(commonClasses, "items-center justify-center")}
      style={{ backgroundColor: accent ?? seedColor(name) }}
    >
      <Text className={cn("text-txt-inverse font-semibold", text)}>
        {getInitials(name)}
      </Text>
    </View>
  );
});