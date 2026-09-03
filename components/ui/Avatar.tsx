import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { cn } from "@/utils/cn";
import { useColors } from "@/lib/tokens";
import { Label } from "./Typography";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  border?: boolean;
  accent?: string;
}

const sizeMap = {
  xs: { container: "w-7 h-7",   text: "text-[10px]" },
  sm: { container: "w-9 h-9",   text: "text-xs" },
  md: { container: "w-12 h-12", text: "text-sm" },
  lg: { container: "w-16 h-16", text: "text-lg" },
  xl: { container: "w-24 h-24", text: "text-2xl" },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

const FALLBACK_FILLS = [
  "primary",
  "secondary",
  "success",
  "warning",
  "magenta",
  "purple",
] as const;

type FallbackKey = (typeof FALLBACK_FILLS)[number];

function seedColorKey(name?: string): FallbackKey {
  if (!name) return FALLBACK_FILLS[0];
  let code = 0;
  for (let i = 0; i < name.length; i++) code += name.charCodeAt(i);
  return FALLBACK_FILLS[code % FALLBACK_FILLS.length];
}

export const Avatar = React.memo(function Avatar({
  uri,
  name,
  size = "md",
  className,
  border = true,
  accent,
}: AvatarProps) {
  const { container, text } = sizeMap[size];
  const colors = useColors();
  const borderColor = colors.surfaceBorder;

  const commonClasses = cn(
    container,
    "overflow-hidden",
    border && "border",
    className,
  );

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={commonClasses}
        style={border ? { borderColor, borderWidth: 1 } : undefined}
        transition={200}
        contentFit="cover"
        cachePolicy="disk"
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        onError={() => console.warn("Failed to load avatar image:", uri)}
        recyclingKey={uri}
      />
    );
  }

  const fallbackKey = seedColorKey(name);
  const bg = accent ?? colors[fallbackKey];

  return (
    <View
      className={cn(commonClasses, "items-center justify-center")}
      style={[{ backgroundColor: bg }, border ? { borderColor, borderWidth: 1 } : undefined]}
    >
      <Label tone="inverse" className={cn(text)}>
        {getInitials(name)}
      </Label>
    </View>
  );
});