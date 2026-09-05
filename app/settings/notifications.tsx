import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ScrollView, Switch, TouchableOpacity, Alert, Modal, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useSettingsStore } from "@/store/settingsStore";
import { useColors } from "@/lib/tokens";
import { fetchUserPreferences, saveUserPreferences } from "@/services/preferences";
import { clearHiddenAnnouncements, getHiddenAnnouncementCount } from "@/services/announcements";
import * as Notifications from "expo-notifications";
import { PageHeader, SectionLabel, IconChip } from "@/components/ui/Page";
import { Card } from "@/components/ui/Card";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Body, EyebrowTight, Subtitle, Label, TileTitle } from "@/components/ui";
import type { NotificationPreferences } from "@/types";

const TIME_OPTIONS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

const TimePickerModal = ({
  visible,
  currentTime,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentTime?: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}) => {
  const colors = useColors();
  const [selectedIndex, setSelectedIndex] = useState(
    currentTime ? TIME_OPTIONS.indexOf(currentTime) : -1,
  );

  useEffect(() => {
    if (visible && currentTime) {
      const index = TIME_OPTIONS.indexOf(currentTime);
      if (index >= 0) setSelectedIndex(index);
    } else if (!currentTime) setSelectedIndex(-1);
  }, [visible, currentTime]);

  const handleDone = () => {
    if (selectedIndex >= 0) onSelect(TIME_OPTIONS[selectedIndex]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="dismiss time picker"
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="border-t border-primary" style={{ backgroundColor: colors.bg }}>
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-surface-border">
              <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="cancel">
                <EyebrowTight tone="secondary">cancel</EyebrowTight>
              </TouchableOpacity>
              <EyebrowTight tone="primary">select time</EyebrowTight>
              <TouchableOpacity onPress={handleDone} accessibilityRole="button" accessibilityLabel="confirm time">
                <EyebrowTight tone="primaryAccent">done</EyebrowTight>
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-[300px]" showsVerticalScrollIndicator={false}>
              {TIME_OPTIONS.map((time, index) => (
                <TouchableOpacity
                  key={time}
                  className={`px-4 py-4 flex-row justify-between items-center border-b border-surface-border ${
                    selectedIndex === index ? "bg-primary-50" : ""
                  }`}
                  onPress={() => setSelectedIndex(index)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedIndex === index }}
                  activeOpacity={0.85}
                >
                  <Label tone={selectedIndex === index ? "primaryAccent" : "primary"}>
                    {time}
                  </Label>
                  {selectedIndex === index && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const ToggleRow = ({
  title,
  subtitle,
  value,
  onValueChange,
  iconName,
  iconColor,
  iconBackground,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  disabled?: boolean;
}) => {
    const colors = useColors();
    return (
      <View className={`flex-row items-center justify-between px-4 py-4 border-b border-surface-border ${disabled ? "opacity-50" : ""}`}>
        <View className="flex-row items-center gap-3 flex-1">
          <IconChip name={iconName} color={iconColor} background={iconBackground} />
          <View className="flex-1">
            <TileTitle tone={disabled ? "muted" : "primary"} className="text-sm">
              {title}
            </TileTitle>
            {subtitle && <Subtitle tone="secondary" className="mt-0.5">{subtitle}</Subtitle>}
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
          thumbColor={colors.surfaceRaised}
          disabled={disabled}
          accessibilityLabel={title}
        />
      </View>
    );
  };

const QuietHoursButton = ({
  label,
  time,
  onPress,
  disabled = false,
}: {
  label: string;
  time?: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
    const colors = useColors();
    return (
      <TouchableOpacity
        className={`flex-1 px-4 py-4 flex-row items-center justify-between border border-surface-border ${
          disabled ? "bg-surface" : "bg-surface-raised"
        }`}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${time || "not set"}`}
        activeOpacity={0.85}
      >
        <EyebrowTight tone={disabled ? "muted" : "primary"}>{label}</EyebrowTight>
        <View className="flex-row items-center gap-2">
          <EyebrowTight tone={disabled ? "muted" : "secondary"} className="text-xs">
            {time || "Not set"}
          </EyebrowTight>
          <Ionicons name="time-outline" size={18} color={disabled ? colors.txtMuted : colors.txtSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

export default function NotificationSettingsScreen() {
  useAuthRedirect();
  const colors = useColors();
  const { user } = useAuthStore();
  const {
    notifications,
    isLoadingPreferences,
    isSyncing,
    loadPreferences,
    savePreferences,
    lastSyncTimestamp,
    setNotifications,
  } = useSettingsStore();

  const [localNotifications, setLocalNotifications] = useState<NotificationPreferences>(notifications);
  const [hasChanges, setHasChanges] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id && user.id !== lastLoadedUserIdRef.current) {
      lastLoadedUserIdRef.current = user.id;
      loadPreferences(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadHiddenCount = async () => {
      const count = await getHiddenAnnouncementCount();
      setHiddenCount(count);
    };
    loadHiddenCount();
  }, [isRefreshing]);

  useEffect(() => setLocalNotifications(notifications), [notifications]);

  useEffect(() => {
    const changed =
      localNotifications.pushEnabled !== notifications.pushEnabled ||
      localNotifications.announcementsEnabled !== notifications.announcementsEnabled ||
      localNotifications.leagueAnnouncementsEnabled !== notifications.leagueAnnouncementsEnabled ||
      localNotifications.gameAnnouncementsEnabled !== notifications.gameAnnouncementsEnabled ||
      localNotifications.padaOrgAnnouncementsEnabled !== notifications.padaOrgAnnouncementsEnabled ||
      localNotifications.scoreNotificationsEnabled !== notifications.scoreNotificationsEnabled ||
      localNotifications.scheduleRemindersEnabled !== notifications.scheduleRemindersEnabled ||
      localNotifications.quietHoursStart !== notifications.quietHoursStart ||
      localNotifications.quietHoursEnd !== notifications.quietHoursEnd;
    setHasChanges(changed);
  }, [localNotifications, notifications]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to save settings");
      return;
    }
    setNotifications(localNotifications);
    const success = await savePreferences(user.id);
    if (success) Alert.alert("Success", "Notification settings saved");
    else Alert.alert("Error", "Failed to save settings. Please try again.");
  };

  const handleRefresh = useCallback(async () => {
    if (!user?.id || hasChanges) return;
    setIsRefreshing(true);
    await loadPreferences(user.id);
    setIsRefreshing(false);
  }, [user?.id, hasChanges, loadPreferences]);

  const handleReset = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all notification settings to defaults?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const defaults: NotificationPreferences = {
              pushEnabled: true,
              announcementsEnabled: true,
              leagueAnnouncementsEnabled: true,
              gameAnnouncementsEnabled: true,
              padaOrgAnnouncementsEnabled: true,
              scoreNotificationsEnabled: true,
              scheduleRemindersEnabled: true,
              quietHoursStart: undefined,
              quietHoursEnd: undefined,
            };
            setLocalNotifications(defaults);
            if (user?.id) {
              setNotifications(defaults);
              await savePreferences(user.id);
            }
          },
        },
      ],
    );
  };

  const handleStartTimeSelect = (time: string) => setLocalNotifications((prev) => ({ ...prev, quietHoursStart: time }));
  const handleEndTimeSelect = (time: string) => setLocalNotifications((prev) => ({ ...prev, quietHoursEnd: time }));

  const handleClearHiddenAnnouncements = () => {
    Alert.alert(
      "Show Hidden Announcements",
      "This will unhide all dismissed announcements. They will appear in your feed again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unhide All",
          onPress: async () => {
            await clearHiddenAnnouncements();
            setHiddenCount(0);
            setIsRefreshing((prev) => !prev);
          },
        },
      ],
    );
  };

  const handleTestNotification = async () => {
    if (!localNotifications.pushEnabled) {
      Alert.alert("Notifications Disabled", "Please enable push notifications first.");
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "Your push notifications are working correctly!",
          data: { type: "test" },
        },
        trigger: null,
      });
      Alert.alert("Success", "Test notification sent!");
    } catch (err) {
      Alert.alert("Error", "Failed to send test notification.");
    }
  };

  if (isLoadingPreferences && !user) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <PageHeader title="notifications" subtitle="preferences" back={() => router.back()} />
        <LoaderBar visible />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <PageHeader
        title="notifications"
        subtitle="preferences"
        back={() => router.back()}
        right={
          <View className="flex-row items-center gap-3">
            {hasChanges && (
              <TouchableOpacity onPress={handleReset} accessibilityRole="button" accessibilityLabel="reset notification settings">
                <EyebrowTight tone="secondary">reset</EyebrowTight>
              </TouchableOpacity>
            )}
            {isSyncing ? (
              <EyebrowTight tone="primaryAccent" className="tracking-[0.18em]">saving…</EyebrowTight>
            ) : (
              <TouchableOpacity onPress={handleSave} disabled={!hasChanges} accessibilityRole="button" accessibilityLabel="save notification settings">
                <EyebrowTight tone={hasChanges ? "primaryAccent" : "muted"}>save</EyebrowTight>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View className="px-5 py-4">
          <SectionLabel>general</SectionLabel>
          <Card variant="default">
            <ToggleRow
              title="Push Notifications"
              subtitle="Receive notifications on your device"
              value={localNotifications.pushEnabled}
              onValueChange={(val) => setLocalNotifications((prev) => ({ ...prev, pushEnabled: val }))}
              iconName="notifications"
              iconColor={colors.primary}
              iconBackground={colors.surfaceOverlay}
            />
          </Card>
        </View>

        <View className="px-5 pb-4">
          <SectionLabel>announcements</SectionLabel>
          <Card variant="default">
            <ToggleRow
              title="All Announcements"
              subtitle="Receive notifications for all announcements"
              value={localNotifications.announcementsEnabled}
              onValueChange={(val) => setLocalNotifications((prev) => ({ ...prev, announcementsEnabled: val }))}
              iconName="megaphone"
              iconColor={colors.warning}
              iconBackground={colors.surfaceOverlay}
              disabled={!localNotifications.pushEnabled}
            />
            <ToggleRow
              title="League Announcements"
              subtitle="Long-term league updates and info"
              value={localNotifications.leagueAnnouncementsEnabled}
              onValueChange={(val) => setLocalNotifications((prev) => ({ ...prev, leagueAnnouncementsEnabled: val }))}
              iconName="trophy"
              iconColor={colors.secondary}
              iconBackground={colors.surfaceOverlay}
              disabled={!localNotifications.pushEnabled || !localNotifications.announcementsEnabled}
            />
            <ToggleRow
              title="Game Announcements"
              subtitle="Game updates (weather, cancellations)"
              value={localNotifications.gameAnnouncementsEnabled}
              onValueChange={(val) => setLocalNotifications((prev) => ({ ...prev, gameAnnouncementsEnabled: val }))}
              iconName="calendar"
              iconColor={colors.warning}
              iconBackground={colors.surfaceOverlay}
              disabled={!localNotifications.pushEnabled || !localNotifications.announcementsEnabled}
            />
            <ToggleRow
              title="PADA Organization"
              subtitle="Organization-wide announcements"
              value={localNotifications.padaOrgAnnouncementsEnabled}
              onValueChange={(val) => setLocalNotifications((prev) => ({ ...prev, padaOrgAnnouncementsEnabled: val }))}
              iconName="business"
              iconColor={colors.purple}
              iconBackground={colors.surfaceOverlay}
              disabled={!localNotifications.pushEnabled || !localNotifications.announcementsEnabled}
            />
          </Card>
        </View>

        <View className="px-5 pb-4">
          <SectionLabel>games & scheduling</SectionLabel>
          <Card variant="default">
            <ToggleRow
              title="Score Notifications"
              subtitle="Game score updates and results"
              value={localNotifications.scoreNotificationsEnabled}
              onValueChange={(val) => setLocalNotifications((prev) => ({ ...prev, scoreNotificationsEnabled: val }))}
              iconName="ribbon"
              iconColor={colors.success}
              iconBackground={colors.surfaceOverlay}
              disabled={!localNotifications.pushEnabled}
            />
            <ToggleRow
              title="Schedule Reminders"
              subtitle="Upcoming game and practice reminders"
              value={localNotifications.scheduleRemindersEnabled}
              onValueChange={(val) => setLocalNotifications((prev) => ({ ...prev, scheduleRemindersEnabled: val }))}
              iconName="alarm"
              iconColor={colors.warning}
              iconBackground={colors.surfaceOverlay}
              disabled={!localNotifications.pushEnabled}
            />
          </Card>
        </View>

        <View className="px-5 pb-4">
          <SectionLabel>quiet hours</SectionLabel>
          <Card variant="default">
            <View className="p-4 gap-3">
              <Body tone="secondary" className="text-xs">
                Notifications will be silenced during these hours
              </Body>
              <View className="flex-row gap-3">
                <QuietHoursButton
                  label="Start"
                  time={localNotifications.quietHoursStart}
                  onPress={() => setShowStartPicker(true)}
                  disabled={!localNotifications.pushEnabled}
                />
                <QuietHoursButton
                  label="End"
                  time={localNotifications.quietHoursEnd}
                  onPress={() => setShowEndPicker(true)}
                  disabled={!localNotifications.pushEnabled}
                />
              </View>
              {(localNotifications.quietHoursStart || localNotifications.quietHoursEnd) && (
                <TouchableOpacity
                  className="items-center py-3"
                  onPress={() => setLocalNotifications((prev) => ({
                    ...prev,
                    quietHoursStart: undefined,
                    quietHoursEnd: undefined,
                  }))}
                  accessibilityRole="button"
                  accessibilityLabel="clear quiet hours"
                  activeOpacity={0.85}
                >
                  <EyebrowTight tone="danger">clear quiet hours</EyebrowTight>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </View>

        <View className="px-5 pb-4">
          <SectionLabel>hidden announcements</SectionLabel>
          <Card variant="default">
            <View className="p-4 gap-3">
              {hiddenCount > 0 ? (
                <>
                  <View className="flex-row items-center gap-3">
                    <IconChip name="eye-off" color={colors.danger} />
                    <View className="flex-1">
                      <TileTitle tone="primary" className="text-sm">
                        {hiddenCount} hidden
                      </TileTitle>
                      <Subtitle tone="secondary" className="mt-0.5">
                        announcements dismissed from feed
                      </Subtitle>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="items-center py-3 border-t border-surface-border"
                    onPress={handleClearHiddenAnnouncements}
                    accessibilityRole="button"
                    accessibilityLabel="show all announcements"
                    activeOpacity={0.85}
                  >
                    <EyebrowTight tone="primaryAccent">show all announcements</EyebrowTight>
                  </TouchableOpacity>
                </>
              ) : (
                <View className="flex-row items-center gap-3">
                  <IconChip name="checkmark-circle" color={colors.success} />
                  <Body tone="secondary" className="text-sm">
                    No hidden announcements
                  </Body>
                </View>
              )}
            </View>
          </Card>
        </View>

        <View className="px-5 pb-4">
          <SectionLabel>notification test</SectionLabel>
          <TouchableOpacity
            className="bg-surface border border-surface-border p-4 flex-row items-center justify-center gap-3"
            onPress={handleTestNotification}
            accessibilityRole="button"
            accessibilityLabel="send test notification"
            activeOpacity={0.85}
          >
            <Ionicons name="notifications" size={20} color={colors.primary} />
            <EyebrowTight tone="primaryAccent">send test notification</EyebrowTight>
          </TouchableOpacity>
        </View>

        {lastSyncTimestamp && (
          <View className="px-5 pb-4">
            <EyebrowTight tone="muted" className="text-center">
              Last synced: {new Date(lastSyncTimestamp).toLocaleString()}
            </EyebrowTight>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      <TimePickerModal
        visible={showStartPicker}
        currentTime={localNotifications.quietHoursStart}
        onSelect={handleStartTimeSelect}
        onClose={() => setShowStartPicker(false)}
      />
      <TimePickerModal
        visible={showEndPicker}
        currentTime={localNotifications.quietHoursEnd}
        onSelect={handleEndTimeSelect}
        onClose={() => setShowEndPicker(false)}
      />
    </SafeAreaView>
  );
}