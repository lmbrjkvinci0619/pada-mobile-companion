import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";
import { cn } from "@/utils/cn";

type Tone =
  | "primary"
  | "secondary"
  | "muted"
  | "inverse"
  | "danger"
  | "warning"
  | "success"
  | "primaryAccent";

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

type Variant =
  | "hero"
  | "title"
  | "section"
  | "tile"
  | "body"
  | "subtitle"
  | "meta"
  | "metaSentence"
  | "eyebrow"
  | "eyebrowTight"
  | "label"
  | "numeric";

type Size = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

const VARIANT_CLASS: Record<Variant, string> = {
  hero:          "text-[44px] font-light lowercase tracking-[-0.01em] leading-[1.02]",
  title:         "text-[34px] font-light lowercase tracking-[-0.01em] leading-[1.05]",
  section:       "text-[24px] font-light lowercase tracking-tight leading-tight",
  tile:          "text-[18px] font-light lowercase tracking-tight leading-tight",
  body:          "text-[15px] font-normal leading-[1.4]",
  subtitle:      "text-[13px] font-normal leading-[1.4]",
  meta:          "text-[10px] font-semibold uppercase tracking-[0.18em]",
  metaSentence:  "text-[12px] font-semibold normal-case tracking-[0.02em]",
  eyebrow:       "text-[11px] font-semibold uppercase tracking-[0.2em]",
  eyebrowTight:  "text-[10px] font-semibold uppercase tracking-[0.12em]",
  label:         "text-[12px] font-semibold uppercase tracking-[0.14em]",
  numeric:       "text-[40px] font-light tabular-nums leading-none",
};

const VARIANT_SIZE: Partial<Record<Variant, Partial<Record<Size, string>>>> = {
  hero: {
    sm:  "text-2xl",
    md:  "text-3xl",
    lg:  "text-[44px]",
    xl:  "text-5xl",
    "2xl": "text-6xl",
    "3xl": "text-7xl",
    "4xl": "text-[88px]",
  },
  title: {
    sm:  "text-2xl",
    md:  "text-3xl",
    lg:  "text-[44px]",
  },
  section: {
    sm:  "text-xl",
    md:  "text-2xl",
    lg:  "text-3xl",
  },
};

interface TypographyProps extends TextProps {
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  className?: string;
  style?: TextStyle | TextStyle[];
}

function makeTypography(v: Variant) {
  return function Typography({
    tone = "primary",
    size,
    className,
    style,
    children,
    numberOfLines,
    ...rest
  }: TypographyProps) {
    const sizeClass = size && VARIANT_SIZE[v] ? VARIANT_SIZE[v]?.[size] : undefined;
    return (
      <Text
        {...rest}
        numberOfLines={numberOfLines}
        className={cn(VARIANT_CLASS[v], sizeClass, TONE_CLASS[tone], className)}
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
export const MetaSentence = makeTypography("metaSentence");
export const Eyebrow = makeTypography("eyebrow");
export const EyebrowTight = makeTypography("eyebrowTight");
export const Label = makeTypography("label");
export const Numeric = makeTypography("numeric");

export const Typography = {
  Hero,
  Title,
  Section,
  TileTitle,
  Body,
  Subtitle,
  Meta,
  MetaSentence,
  Eyebrow,
  EyebrowTight,
  Label,
  Numeric,
};

export type { Variant as TypographyVariant, Tone as TypographyTone };