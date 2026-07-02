import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { EXTERNAL_URLS, openUrl } from "@/lib/urlUtils";

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { notifications, loadPreferences } = useSettingsStore();
  const router = useRouter();
  const lastLoadedUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (userId && userId !== lastLoadedUserId.current) {
      lastLoadedUserId.current = userId;
      loadPreferences(userId);
    }
  }, [user?.id, loadPreferences]);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const getNotificationStatus = () => {
    if (!notifications.pushEnabled) return "Disabled";
    const enabled: string[] = [];
    if (notifications.leagueAnnouncementsEnabled) enabled.push("League");
    if (notifications.gameAnnouncementsEnabled) enabled.push("Game");
    if (notifications.padaOrgAnnouncementsEnabled) enabled.push("PADA");
    if (notifications.scoreNotificationsEnabled) enabled.push("Scores");
    if (notifications.scheduleRemindersEnabled) enabled.push("Reminders");
    return enabled.length > 0 ? enabled.join(", ") : "All disabled";
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={["#161B22", "#0D1117"]}
          className="px-5 pt-8 pb-12 rounded-b-[50px] shadow-2xl items-center"
        >
          <TouchableOpacity 
            onPress={() => router.push("/settings/profile")}
            activeOpacity={0.8}
          >
            <View className="relative">
              <Avatar
                name={`${user?.firstName} ${user?.lastName}`}
                uri={user?.avatarUrl}
                size="xl"
                className="border-4 border-primary-500/20"
              />
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full border-4 border-[#161B22] items-center justify-center">
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/settings/profile")} className="mt-4">
            <Text className="text-txt-primary text-3xl font-black">
              {user?.firstName} {user?.lastName}
            </Text>
            <View className="flex-row items-center justify-center gap-2 mt-1">
              <Text className="text-primary-300 text-sm font-bold opacity-80">{user?.email}</Text>
              <Ionicons name="pencil" size={14} color="#1E88E5" />
            </View>
          </TouchableOpacity>

          <View className="bg-primary-500/10 px-4 py-1.5 rounded-2xl mt-4 border border-primary-500/20">
            <Text className="text-primary-200 text-[10px] font-black uppercase tracking-[2px]">{user?.role}</Text>
          </View>
        </LinearGradient>

        <TouchableOpacity
              onPress={() => openUrl(EXTERNAL_URLS.donate)}
              activeOpacity={0.8}
              className="mx-5 mt-6"
            >
              <LinearGradient
                colors={["#2D7D2D", "#1B5E20"]}
                className="rounded-2xl py-4 px-6 flex-row items-center justify-center gap-3"
              >
                <Ionicons name="heart" size={22} color="#fff" />
                <Text className="text-white text-base font-black">Donate to PADA</Text>
              </LinearGradient>
            </TouchableOpacity>

          <View className="px-5 mt-8">
            <Text className="text-txt-primary text-lg font-black mb-4">Quick Links</Text>

            <View className="bg-surface rounded-3xl overflow-hidden border border-surface-border/30 mb-4">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openUrl(EXTERNAL_URLS.newToPada)}
                className="flex-row items-center justify-between px-6 py-4 border-b border-surface-overlay"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-9 h-9 rounded-xl bg-primary-500/10 items-center justify-center">
                    <Ionicons name="rocket" size={18} color="#388BFD" />
                  </View>
                  <Text className="text-txt-primary text-sm font-bold">New to PADA?</Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#484F58" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openUrl(EXTERNAL_URLS.youth)}
                className="flex-row items-center justify-between px-6 py-4 border-b border-surface-overlay"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-9 h-9 rounded-xl bg-warning/10 items-center justify-center">
                    <Ionicons name="happy" size={18} color="#D29922" />
                  </View>
                  <Text className="text-txt-primary text-sm font-bold">Youth Programs</Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#484F58" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openUrl(EXTERNAL_URLS.schedule)}
                className="flex-row items-center justify-between px-6 py-4 border-b border-surface-overlay"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-9 h-9 rounded-xl bg-accent/10 items-center justify-center">
                    <Ionicons name="calendar" size={18} color="#3FB950" />
                  </View>
                  <Text className="text-txt-primary text-sm font-bold">Event Calendar</Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#484F58" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openUrl(EXTERNAL_URLS.fields)}
                className="flex-row items-center justify-between px-6 py-4"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-9 h-9 rounded-xl bg-danger/10 items-center justify-center">
                    <Ionicons name="location" size={18} color="#E53935" />
                  </View>
                  <Text className="text-txt-primary text-sm font-bold">Fields & Locations</Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#484F58" />
              </TouchableOpacity>
            </View>

          <Text className="text-txt-primary text-lg font-black mb-4">Settings & Privacy</Text>

          <View className="bg-surface rounded-3xl overflow-hidden border border-surface-border/30 mb-6">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/settings/profile")}
              className="flex-row items-center justify-between px-6 py-5 border-b border-surface-overlay"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-primary-500/10 items-center justify-center">
                  <Ionicons name="person" size={20} color="#388BFD" />
                </View>
                <View>
                  <Text className="text-txt-primary text-base font-bold">Profile</Text>
                  <Text className="text-txt-secondary text-xs">Manage your account</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#484F58" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/settings/notifications")}
              className="flex-row items-center justify-between px-6 py-5 border-b border-surface-overlay"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-warning/10 items-center justify-center">
                  <Ionicons name="notifications" size={20} color="#D29922" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-txt-primary text-base font-bold">Notifications</Text>
                    <View className={`w-2 h-2 rounded-full ${notifications.pushEnabled ? "bg-accent" : "bg-danger"}`} />
                  </View>
                  <Text className="text-txt-secondary text-xs" numberOfLines={1}>{getNotificationStatus()}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#484F58" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openUrl(EXTERNAL_URLS.privacy)}
              className="flex-row items-center justify-between px-6 py-5 border-b border-surface-overlay"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-accent/10 items-center justify-center">
                  <Ionicons name="shield-checkmark" size={20} color="#3FB950" />
                </View>
                <View>
                  <Text className="text-txt-primary text-base font-bold">Privacy</Text>
                  <Text className="text-txt-secondary text-xs">Data and security</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={18} color="#484F58" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openUrl(EXTERNAL_URLS.supportEmail)}
              className="flex-row items-center justify-between px-6 py-5"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-danger/10 items-center justify-center">
                  <Ionicons name="help-circle" size={20} color="#E53935" />
                </View>
                <View>
                  <Text className="text-txt-primary text-base font-bold">Support</Text>
                  <Text className="text-txt-secondary text-xs">Help and feedback</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={18} color="#484F58" />
            </TouchableOpacity>
          </View>

          <Text className="text-txt-primary text-lg font-black mb-4">Developer</Text>
          <View className="bg-surface rounded-3xl overflow-hidden border border-surface-border/30 mb-8">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/debug/ui-gallery")}
              className="flex-row items-center justify-between px-6 py-5"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-primary-500/10 items-center justify-center">
                  <Ionicons name="color-palette" size={20} color="#388BFD" />
                </View>
                <View>
                  <Text className="text-txt-primary text-base font-bold">UI Gallery</Text>
                  <Text className="text-txt-secondary text-xs">Design system preview</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#484F58" />
            </TouchableOpacity>
          </View>

          <Button
            variant="ghost"
            label="Log Out"
            onPress={logout}
            className="mb-12 border-danger/30"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

