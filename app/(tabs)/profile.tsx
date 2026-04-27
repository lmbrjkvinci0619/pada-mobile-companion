import React from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = React.useState(true);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5 pt-6">
        <View className="items-center mb-8 bg-surface rounded-3xl py-8">
          <Avatar name={`${user?.firstName} ${user?.lastName}`} uri={user?.avatarUrl} size="xl" />
          <Text className="text-txt-primary text-2xl font-bold mt-4">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-txt-secondary text-base">{user?.email}</Text>
          <View className="bg-primary-500/20 px-3 py-1 rounded-full mt-2 border border-primary-500/40">
            <Text className="text-primary-300 text-xs font-bold uppercase">{user?.role}</Text>
          </View>
        </View>

        <Text className="text-txt-secondary text-sm font-bold uppercase mb-3 ml-2">Preferences</Text>
        <View className="bg-surface rounded-2xl mb-8">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-surface-overlay">
            <Text className="text-txt-primary text-base font-mid">Push Notifications</Text>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} />
          </View>
        </View>

        <Button variant="danger" label="Log Out" onPress={logout} />
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
