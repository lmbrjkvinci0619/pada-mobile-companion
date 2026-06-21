import React, { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { openRegistrationInBrowser } from "@/lib/urlUtils";

export default function RegistrationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      openRegistrationInBrowser(id);
    }
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator size="large" color="#1E88E5" />
      <Text className="text-txt-secondary mt-4">Opening registration...</Text>
    </SafeAreaView>
  );
}