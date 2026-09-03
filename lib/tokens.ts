import { Appearance, useColorScheme } from "react-native";

export type Scheme = "light" | "dark";

export const palette = {
  light: {
    bg: "#FFFFFF",
    bgSecondary: "#F4F4F4",
    surface: "#F4F4F4",
    surfaceRaised: "#FFFFFF",
    surfaceOverlay: "#E6E6E6",
    surfaceBorder: "#D8D8D8",
    txtPrimary: "#000000",
    txtSecondary: "#5C5C5C",
    txtMuted: "#8A8A8A",
    txtInverse: "#FFFFFF",
    primary: "#00ABA9",
    primary700: "#006D6B",
    primary50: "#E0F7F7",
    secondary: "#1BA1E2",
    success: "#339933",
    warning: "#F09609",
    danger: "#E51400",
    magenta: "#D80073",
    purple: "#A200FF",
    black: "#000000",
    white: "#FFFFFF",
    tilePrimary: "#00ABA9",
    tileSecondary: "#1BA1E2",
    tileSuccess: "#339933",
    tileWarning: "#F09609",
    tileDanger: "#E51400",
    tileMagenta: "#D80073",
    tilePurple: "#A200FF",
    tileBlack: "#000000",
  },
  dark: {
    bg: "#000000",
    bgSecondary: "#1A1A1A",
    surface: "#1A1A1A",
    surfaceRaised: "#222222",
    surfaceOverlay: "#2A2A2A",
    surfaceBorder: "#3A3A3A",
    txtPrimary: "#FFFFFF",
    txtSecondary: "#A0A0A0",
    txtMuted: "#6E6E6E",
    txtInverse: "#000000",
    primary: "#26C6C4",
    primary700: "#4DCFCD",
    primary50: "#003E3D",
    secondary: "#2AADE8",
    success: "#60A960",
    warning: "#FAAA24",
    danger: "#FF3322",
    magenta: "#FF3399",
    purple: "#D08AFF",
    black: "#000000",
    white: "#FFFFFF",
    tilePrimary: "#26C6C4",
    tileSecondary: "#2AADE8",
    tileSuccess: "#60A960",
    tileWarning: "#FAAA24",
    tileDanger: "#FF3322",
    tileMagenta: "#FF3399",
    tilePurple: "#C155FF",
    tileBlack: "#000000",
  },
} as const;

export type ColorKey = keyof typeof palette.light;

export function getColors(scheme: Scheme = (Appearance.getColorScheme() ?? "light") as Scheme) {
  return scheme === "dark" ? palette.dark : palette.light;
}

export function useColors() {
  const scheme = useColorScheme();
  return getColors((scheme ?? "light") as Scheme);
}