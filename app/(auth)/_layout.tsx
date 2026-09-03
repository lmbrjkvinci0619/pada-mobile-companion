import React from "react";
import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { View, Text } from "react-native";
import { LoaderBar } from "@/components/ui/LoaderBar";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg">
        <LoaderBar visible />
        <View className="flex-1 items-center justify-center">
          <Text className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.2em]">loading</Text>
        </View>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
   </Stack>
  );
}
