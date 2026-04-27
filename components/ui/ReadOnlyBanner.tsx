import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PADA_ORG_URL } from "@/constants/config";

interface ReadOnlyBannerProps {
  message?: string;
  showLink?: boolean;
}

export function ReadOnlyBanner({
  message = "This information is read-only. To make changes, visit Pada.org.",
  showLink = true,
}: ReadOnlyBannerProps) {
  return (
    <View className="flex-row items-start gap-3 bg-primary-500/10 border border-primary-500/20 rounded-xl px-4 py-3 mx-4 mb-3">
      <Ionicons name="information-circle-outline" size={18} color="#64B5F6" />
      <View className="flex-1">
        <Text className="text-primary-200 text-sm font-mid leading-5">{message}</Text>
        {showLink && (
          <TouchableOpacity onPress={() => Linking.openURL(PADA_ORG_URL)}>
            <Text className="text-primary-400 text-sm font-semi underline mt-1">
              Open Pada.org →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
