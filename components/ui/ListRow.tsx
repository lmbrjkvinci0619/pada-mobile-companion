import React from "react";
import { View, TouchableOpacity, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import { Body, Subtitle } from "./Typography";

interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  external?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  last?: boolean;
  right?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const ListRow = React.memo(function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  external,
  destructive,
  disabled,
  last,
  right,
  className,
  style,
}: ListRowProps) {
  const content = (
    <>
      <View className="flex-row items-center gap-3 flex-1">
        {icon}
        <View className="flex-1">
          <Body
            numberOfLines={1}
            className={cn("text-sm font-semibold", disabled && "text-txt-muted")}
            tone={destructive ? "danger" : disabled ? "muted" : "primary"}
          >
            {title}
          </Body>
          {subtitle && (
            <Subtitle
              numberOfLines={1}
              className={cn("mt-0.5", disabled && "text-txt-muted")}
              tone={disabled ? "muted" : "secondary"}
            >
              {subtitle}
            </Subtitle>
          )}
        </View>
      </View>
      {right ?? (
        onPress ? (
          <Ionicons
            name={external ? "open-outline" : "chevron-forward"}
            size={18}
            color={disabled ? "#8A8A8A" : "#5C5C5C"}
          />
        ) : null
      )}
    </>
  );

  const containerClass = cn(
    "flex-row items-center justify-between px-4 py-4",
    !last && "border-b border-surface-border",
    disabled && "opacity-60",
    className,
  );

  if (!onPress || disabled) {
    return (
      <View className={containerClass} style={style} accessibilityRole={onPress ? "button" : undefined}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ disabled: !!disabled }}
      className={containerClass}
      style={style}
    >
      {content}
    </TouchableOpacity>
  );
});