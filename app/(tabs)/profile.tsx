import React, { useEffect, useRef } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { Tile, TileGrid, TileCell } from "@/components/ui/Tile";
import { PageHeader, IconChip, SectionLabel } from "@/components/ui/Page";
import { DonateFooter } from "@/components/ui/DonateFooter";
import { Section, Body, Eyebrow, Subtitle, EyebrowTight } from "@/components/ui";
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

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "player";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-6 pb-6 items-center bg-surface border-b border-surface-border">
          <TouchableOpacity onPress={() => router.push("/settings/profile")} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="edit profile photo">
            <Avatar
              name={fullName}
              uri={user?.avatarUrl}
              size="xl"
              border
              accent="#00ABA9"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/settings/profile")} className="mt-4 items-center" accessibilityRole="button" accessibilityLabel="edit profile">
            <Section numberOfLines={1} className="text-3xl">
              {fullName}
            </Section>
            <View className="flex-row items-center justify-center gap-2 mt-1">
              <Body tone="secondary" className="text-sm">{user?.email}</Body>
              <Ionicons name="pencil" size={14} color="#00ABA9" />
            </View>
          </TouchableOpacity>

          {user?.role && (
            <View className="bg-surface-overlay border border-primary px-4 py-1 mt-3">
              <Eyebrow tone="primaryAccent" className="text-[10px] tracking-[0.2em]">
                {user.role}
              </Eyebrow>
            </View>
          )}
        </View>

        <View className="px-5 pt-5">
          <TouchableOpacity
            onPress={() => openUrl(EXTERNAL_URLS.donate)}
            activeOpacity={0.9}
            accessibilityRole="link"
            accessibilityLabel="donate to PADA"
          >
            <Tile
              size="wide"
              accent="magenta"
              eyebrow="support"
              title="Donate to PADA"
              subtitle="keep the spirit of the game alive"
              icon={<Ionicons name="heart" size={28} color="#FFFFFF" />}
            />
          </TouchableOpacity>
        </View>

        <View className="px-5 mt-6">
          <SectionLabel>quick links</SectionLabel>
          <View className="bg-surface border border-surface-border">
            <ListRow
              icon={<IconChip name="rocket" color="#1BA1E2" background="#1BA1E222" />}
              title="New to PADA?"
              onPress={() => openUrl(EXTERNAL_URLS.newToPada)}
              external
            />
            <ListRow
              icon={<IconChip name="happy" color="#F09609" background="#F0960922" />}
              title="Youth Programs"
              onPress={() => openUrl(EXTERNAL_URLS.youth)}
              external
              last
            />
          </View>
        </View>

        <View className="px-5 mt-6">
          <SectionLabel>settings</SectionLabel>
          <View className="bg-surface border border-surface-border">
            <ListRow
              icon={<IconChip name="person" color="#00ABA9" background="#00ABA922" />}
              title="Profile"
              subtitle="Manage your account"
              onPress={() => router.push("/settings/profile")}
            />
            <ListRow
              icon={
                <IconChip
                  name="notifications"
                  color={notifications.pushEnabled ? "#F09609" : "#8A8A8A"}
                  background={notifications.pushEnabled ? "#F0960922" : "#8A8A8A22"}
                />
              }
              title="Notifications"
              subtitle={getNotificationStatus()}
              onPress={() => router.push("/settings/notifications")}
            />
            <ListRow
              icon={<IconChip name="shield-checkmark" color="#339933" background="#33993322" />}
              title="Privacy"
              subtitle="Data and security"
              onPress={() => openUrl(EXTERNAL_URLS.privacy)}
              external
            />
            <ListRow
              icon={<IconChip name="help-circle" color="#E51400" background="#E5140022" />}
              title="Support"
              subtitle="Help and feedback"
              onPress={() => openUrl(EXTERNAL_URLS.supportEmail)}
              external
              last
            />
          </View>
        </View>

        <View className="px-5 mt-6 mb-10">
          <SectionLabel>developer</SectionLabel>
          <View className="bg-surface border border-surface-border">
            <ListRow
              icon={<IconChip name="color-palette" color="#A200FF" background="#A200FF22" />}
              title="UI Gallery"
              subtitle="Design system preview"
              onPress={() => router.push("/debug/ui-gallery")}
              last
            />
          </View>
        </View>

        <View className="px-5 pb-12">
          <Button variant="ghost" label="Log Out" onPress={logout} className="border-danger" />
        </View>
      </ScrollView>
      <DonateFooter />
    </SafeAreaView>
  );
}