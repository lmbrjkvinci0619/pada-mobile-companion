import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";
import { cn } from "@/utils/cn";

type Tone = "primary" | "secondary" | "muted" | "inverse" | "danger" | "warning" | "success" | "primaryAccent";

const TONE_CLASS: Record<Tone, string> = {
  primary: "text-txt-primary",
  secondary: "text-txt-secondary",
  muted: "text-txt-muted",
  inverse: "text-txt-inverse",
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
  primaryAccent: "text-primary",
};

type Variant = "hero" | "title" | "section" | "tile" | "body" | "subtitle" | "meta" | "eyebrow" | "eyebrowTight" | "label";

const VARIANT_CLASS: Record<Variant, string> = {
  hero:          "text-[44px] font-light lowercase tracking-tight leading-[1.05]",
  title:         "text-[40px] font-light lowercase tracking-tight leading-[1.05]",
  section:       "text-[28px] font-light lowercase tracking-tight leading-tight",
  tile:          "text-lg font-light lowercase tracking-tight leading-tight",
  body:          "text-[15px] font-normal leading-snug",
  subtitle:      "text-xs font-normal leading-snug",
  meta:          "text-[10px] font-semibold uppercase tracking-[0.18em]",
  eyebrow:       "text-[11px] font-semibold uppercase tracking-[0.2em]",
  eyebrowTight:  "text-[10px] font-semibold uppercase tracking-[0.12em]",
  label:         "text-xs font-semibold uppercase tracking-[0.12em]",
};

interface TypographyProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  className?: string;
  style?: TextStyle | TextStyle[];
}

function makeTypography(v: Variant) {
  return function Typography({
    tone = "primary",
    className,
    style,
    children,
    numberOfLines,
    ...rest
  }: TypographyProps) {
    return (
      <Text
        {...rest}
        numberOfLines={numberOfLines}
        className={cn(VARIANT_CLASS[v], TONE_CLASS[tone], className)}
        style={style}
      >
        {children}
      </Text>
    );
  };
}

export const Hero = makeTypography("hero");
export const Title = makeTypography("title");
export const Section = makeTypography("section");
export const TileTitle = makeTypography("tile");
export const Body = makeTypography("body");
export const Subtitle = makeTypography("subtitle");
export const Meta = makeTypography("meta");
export const Eyebrow = makeTypography("eyebrow");
export const EyebrowTight = makeTypography("eyebrowTight");
export const Label = makeTypography("label");

export const Typography = {
  Hero,
  Title,
  Section,
  TileTitle,
  Body,
  Subtitle,
  Meta,
  Eyebrow,
  EyebrowTight,
  Label,
};

export type { Variant as TypographyVariant, Tone as TypographyTone };
