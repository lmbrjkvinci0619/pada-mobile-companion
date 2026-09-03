import React from "react";
import { View, TouchableOpacity, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";
import { Body, Subtitle, Eyebrow } from "./Typography";

interface CardProps extends ViewProps {
  variant?: "default" | "raised" | "accent";
  accent?: string;
  className?: string;
}

function CardComponent({
  variant = "default",
  accent,
  className,
  children,
  ...props
}: CardProps) {
  const fill =
    variant === "raised"
      ? "bg-surface-raised"
      : variant === "accent" && accent
        ? ""
        : "bg-surface";
  return (
    <View
      {...props}
      className={cn(
        variant === "accent" && accent ? "" : fill,
        className,
      )}
      style={variant === "accent" && accent ? { backgroundColor: accent } : props.style}
    >
      {children}
    </View>
  );
}

function CardHeader({
  title,
  subtitle,
  icon,
  className,
  children,
  onPress,
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.85 } : {})}
      className={cn(
        "px-4 pt-4 pb-3 flex-row items-center justify-between border-b border-surface-border",
        className,
      )}
    >
      <View className="flex-1 flex-row items-center gap-3">
        {icon}
        <View className="flex-1">
          {title && (
            <Body tone="primary" className="font-semibold">
              {title}
            </Body>
          )}
          {subtitle && (
            <Subtitle tone="secondary" className="mt-0.5">
              {subtitle}
            </Subtitle>
          )}
        </View>
      </View>
      {children}
    </Wrapper>
  );
}

function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn("px-4 py-4", className)}>{children}</View>;
}

function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <View
      className={cn(
        "px-4 py-3 border-t border-surface-border flex-row items-center justify-end gap-2",
        className,
      )}
    >
      {children}
    </View>
  );
}

export const Card = Object.assign(React.memo(CardComponent), {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});

export function CardSection({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={cn("gap-3", className)}>
      {title && (
        <Eyebrow tone="secondary" className="px-1">
          {title}
        </Eyebrow>
      )}
      {children}
    </View>
  );
}