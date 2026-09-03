import React from "react";
import { View, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PADA_ORG_URL } from "@/constants/config";
import { useColors } from "@/lib/tokens";
import { Body, Eyebrow } from "./Typography";

interface ReadOnlyBannerProps {
  message?: string;
  showLink?: boolean;
}

export const ReadOnlyBanner = React.memo(function ReadOnlyBanner({
  message = "This information is read-only. To make changes, visit Pada.org.",
  showLink = true,
}: ReadOnlyBannerProps) {
  const colors = useColors();
  const isDark = colors.bg.toLowerCase() === "#000000";
  const bg = isDark ? colors.surfaceRaised : colors.primary700;
  const fg = isDark ? colors.txtPrimary : colors.txtInverse;
  return (
    <View
      className="flex-row items-center gap-3 px-4 py-3 mb-3"
      style={{ backgroundColor: bg }}
      accessibilityRole="summary"
    >
      <Ionicons name="information-circle" size={20} color={fg} />
      <View className="flex-1">
        <Body style={{ color: fg }} className="text-sm leading-5">
          {message}
        </Body>
        {showLink && (
          <TouchableOpacity
            onPress={() => Linking.openURL(PADA_ORG_URL)}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="open Pada.org"
          >
            <Eyebrow style={{ color: fg }} className="mt-1 underline">
              Launch Pada.org
            </Eyebrow>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});