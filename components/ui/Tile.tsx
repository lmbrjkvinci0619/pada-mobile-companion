import React from "react";
import { View, TouchableOpacity, type ViewStyle } from "react-native";
import { cn } from "@/utils/cn";
import { useColors, type ColorKey } from "@/lib/tokens";
import { Eyebrow, EyebrowTight, TileTitle, Subtitle, Meta } from "./Typography";

type Accent =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "magenta"
  | "purple"
  | "black";

const TILE_KEY: Record<Accent, ColorKey> = {
  primary:   "tilePrimary",
  secondary: "tileSecondary",
  success:   "tileSuccess",
  warning:   "tileWarning",
  danger:    "tileDanger",
  magenta:   "tileMagenta",
  purple:    "tilePurple",
  black:     "tileBlack",
};

interface TileProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  meta?: string;
  icon?: React.ReactNode;
  accent?: Accent;
  size?: "small" | "medium" | "wide";
  onPress?: () => void;
  badge?: string;
  className?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const sizeClass: Record<NonNullable<TileProps["size"]>, string> = {
  small:  "min-h-[96px] px-3 py-3",
  medium: "min-h-[128px] px-4 py-4",
  wide:   "min-h-[160px] px-4 py-4",
};

const lc = (s?: string) => (s ? s.toLowerCase() : s);

export const Tile = React.memo(function Tile({
  title,
  subtitle,
  eyebrow,
  meta,
  icon,
  accent = "primary",
  size = "medium",
  onPress,
  badge,
  className,
  style,
  children,
}: TileProps) {
  const colors = useColors();
  const fill = colors[TILE_KEY[accent]];
  const Wrapper: any = onPress ? TouchableOpacity : View;
  const badgeBg = colors.surfaceRaised;
  const badgeFg = colors.primary;

  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.85 } : {})}
      accessibilityRole={onPress ? "button" : "summary"}
      accessibilityLabel={[eyebrow, title, subtitle].filter(Boolean).join(", ")}
      className={cn(
        "justify-between",
        sizeClass[size],
        className,
      )}
      style={[{ backgroundColor: fill }, style]}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          {eyebrow && (
            <EyebrowTight tone="inverse" className="tracking-[0.18em]">
              {eyebrow}
            </EyebrowTight>
          )}
          {icon ? <View className="mt-1">{icon}</View> : null}
        </View>
        {badge && (
          <View
            className="px-2 py-0.5"
            style={{ backgroundColor: badgeBg }}
          >
            <EyebrowTight style={{ color: badgeFg }}>{badge}</EyebrowTight>
          </View>
        )}
      </View>

      <View>
        {title && (
          <TileTitle tone="inverse" numberOfLines={2}>
            {lc(title)}
          </TileTitle>
        )}
        {subtitle && (
          <Subtitle tone="inverse" numberOfLines={1} className="mt-1">
            {subtitle}
          </Subtitle>
        )}
        {meta && (
          <Meta tone="inverse" numberOfLines={1} className="mt-2">
            {meta}
          </Meta>
        )}
      </View>

      {children}
    </Wrapper>
  );
});

export function TileGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn("flex-row flex-wrap gap-2", className)}>{children}</View>;
}

export function TileCell({ children, basis = "1/2" }: { children: React.ReactNode; basis?: "1/2" | "1/3" | "2/3" | "full" }) {
  const basisMap: Record<string, string> = {
    "1/2":  "w-[calc(50%-4px)]",
    "1/3":  "w-[calc(33.333%-5.33px)]",
    "2/3":  "w-[calc(66.666%-2.66px)]",
    full:   "w-full",
  };
  return <View className={basisMap[basis]}>{children}</View>;
}