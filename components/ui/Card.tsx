import React from "react";
import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";

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
        "border-2 border-surface-border",
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
  const Wrapper: any = onPress ? require("react-native").TouchableOpacity : View;
  return (
    <Wrapper
      {...(onPress ? { onPress, activeOpacity: 0.85 } : {})}
      className={cn("px-4 pt-4 pb-3 flex-row items-center justify-between border-b-2 border-surface-border", className)}
    >
      <View className="flex-1 flex-row items-center gap-3">
        {icon}
        <View className="flex-1">
          {title && <Text className="text-txt-primary font-bold text-base">{title}</Text>}
          {subtitle && <Text className="text-txt-secondary text-xs mt-0.5">{subtitle}</Text>}
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
    <View className={cn("px-4 py-3 border-t-2 border-surface-border flex-row items-center justify-end gap-2", className)}>
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
        <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-[0.18em] px-1">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}