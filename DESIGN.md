---
version: 1.0.0
name: PadaHubMetro
description: Microsoft Metro–styled mobile companion for PADA. Light-first, teal accent, sharp corners, typography-led Hub/Pivot/Tile system.
---

# PadaHub Metro Design System

This document defines the visual world for PadaHub, a React Native (Expo) mobile companion for the Portland Area Disc Alliance (PADA). The visual language is Microsoft's Metro / Modern Design Language — content over chrome, typographic contrast, sharp 90° corners, solid accent colors, and motion as feedback.

## Design Principles

1. **Content, not chrome** — Tiles and panels carry data; no decorative shadows, no gradients, no rounded shapes.
3. **Typographic contrast** — A single sans family (Inter / Segoe UI fallback). Thin display headers next to dense body copy.
4. **Authentically digital** — Pure flat fills, sharp edges, solid color tiles, no skeuomorphism.
5. **Pivot and Panorama** — The app navigates through horizontally-panning Hub panels and lowercase Pivot sub-headers.
6. **Alive in motion** — Tiles depress on press; pivots slide horizontally; nothing else moves.

## Color System

### Surfaces (light-first, dark available)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `bg` | `#FFFFFF` | `#000000` | Page background |
| `surface` | `#F4F4F4` | `#1A1A1A` | Tile / panel background |
| `surface-raised` | `#FFFFFF` | `#222222` | Raised tile / card |
| `surface-overlay` | `#E6E6E6` | `#2A2A2A` | Borders, dividers, pressed state |
| `border` | `#D8D8D8` | `#3A3A3A` | Hairline dividers |

### Text

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `txt-primary` | `#000000` | `#FFFFFF` | Headings, body |
| `txt-secondary` | `#5C5C5C` | `#A0A0A0` | Captions, metadata |
| `txt-muted` | `#8A8A8A` | `#6E6E6E` | Disabled, hints |
| `txt-inverse` | `#FFFFFF` | `#000000` | Text on accent fills |

### Metro Accents

| Token | Hex | Use |
|-------|-----|-----|
| `primary` (teal) | `#00ABA9` | Brand accent, primary action, live tile |
| `secondary` (cobalt) | `#1BA1E2` | Informational tile / link |
| `success` (green) | `#339933` | Confirmed status |
| `warning` (amber) | `#F09609` | Pending / reminder |
| `danger` (red) | `#E51400` | Live, urgent, destructive |
| `magenta` | `#D80073` | Optional highlight |
| `purple` | `#A200FF` | Optional highlight |
| `orange` | `#F09609` | Optional highlight |

Accent tiles always carry white text. Tile flip (press) reveals a slightly darker shade of the same hue.

## Typography

Single family: **Inter** (loaded via `@expo-google-fonts/inter`), with `Segoe UI` / system-sans fallbacks. Never use display faces, italics, or text shadows.

| Role | Size | Weight | Case | Tracking |
|------|------|--------|------|----------|
| Hero (Panorama title) | 4.5rem (72 px) | Light (300) | lowercase | −0.01em |
| Title (page header) | 2.5rem (40 px) | Light (300) | lowercase | −0.01em |
| Section (Pivot / Hub panel header) | 1.75rem (28 px) | Light (300) | lowercase | tight |
| Tile title | 1.125rem (18 px) | Light (300) | lowercase | tight |
| Sub-tile subtitle | 0.75rem (12 px) | Regular (400) | sentence | normal |
| Eyebrow / caption / button | 0.625–0.6875rem (10–11 px) | SemiBold (600) | UPPER | 0.12–0.20em |
| Body | 0.9375rem (15 px) | Regular (400) | sentence | normal |

Body line height 1.4. Display line height 1.05.

**Typography rule:** headings and tile titles are **Light (300) and lowercase**; metadata, badges, eyebrows, and button labels are **SemiBold (600), uppercase, tracked**. Do not use 700 weights.

## Geometry

- **Border radius: 0 everywhere.** Buttons, inputs, tiles, avatars, badges, modals — all sharp 90° corners.
- **Borders**: 1 px hairlines use `surface-overlay`; 2 px accents use `border` or accent fills.
- **Spacing scale**: 4, 8, 12, 16, 24, 32, 48 px. Tighter above a heading than below it.

## Components

### Tile
- Flat solid fill, 0 radius, 12–16 px internal padding (small = 12 px; medium/wide = 16 px).
- Three sizes: **small** (1 col, 96 px), **medium** (2×1, 128 px), **wide** (2×2 / 4×2, min 160 px).
- Press feedback: opacity 1 → 0.85 over 100 ms, no scale.
- Optional `count` badge in top-right.
- Title rendered in Light (300) lowercase via internal auto-lowercasing — callers may pass sentence case and the Tile lowercases it.

### Pivot
- Horizontal lowercase headers (`roster`, `schedule`, `stats`).
- Active header carries a 2 px teal underline.
- Adjacent headers fade to 50% opacity.
- Swipe or tap to switch.

### Hub (Panorama)
- Horizontally panning ScrollView of panels.
- One oversized header spans across panels.
- Snap-to-panel on swipe.

### Button
- Variants: `primary` (teal fill, white text), `secondary` (surface fill, primary text), `ghost` (transparent, primary text), `danger` (red fill), `outline` (bordered).
- Sizes: sm (32 px), md (44 px), lg (52 px).
- No rounded corners. Active state inverts fill/foreground.

### Card
- Flat `surface` fill with a 1px hairline divider at top.
- Header / Content / Footer slots, all sharp.

### Badge
- 0 radius, 1 px border, dense caps text.
- Variants match accent palette.

### Avatar
- Square (0 radius), 2 px border on `border`, monogram fallback over teal / accent fill.

## Motion

- **Tile press**: opacity 1 → 0.85, 100 ms ease-out. No scale.
- **Pivot switch**: translateX between panels, 220 ms ease-in-out.
- **Hub pan**: native scroll, snap to panel width.
- No entrance choreography on lists; lists render directly.

## Do

- Use sharp 90° corners on every interactive element.
- Use teal `#00ABA9` for the primary action, brand mark, and active state.
- Use lowercase for Panorama and Pivot titles.
- Use uppercase + tracking for metadata captions.
- Tint secondary text from the surface hue, never use pure gray.
- Respect the spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48.

## Don't

- No border-radius above 0 anywhere.
- No gradients, shadows, glows, or blurs.
- No italics, no display faces, no emoji-as-icon.
- No 1 px colored accent borders on cards.
- No skeuomorphic textures or material metaphors.
- No purple-on-dark unless WCAG AA contrast is verified.
- No `font-bold` (700). All headings, buttons, and captions are SemiBold 600 max; display and tile titles are Light 300.