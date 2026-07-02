import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator, Modal, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useSettingsStore } from "@/store/settingsStore";
import { fetchUserPreferences, saveUserPreferences } from "@/services/preferences";
import { clearHiddenAnnouncements, getHiddenAnnouncementCount } from "@/services/announcements";
import * as Notifications from "expo-notifications";
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
  onClose
}: {
  visible: boolean;
  currentTime?: string;
  onSelect: (time: string) => void;
  onClose: () => void;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(
    currentTime ? TIME_OPTIONS.indexOf(currentTime) : -1
  );

  useEffect(() => {
    if (visible && currentTime) {
      const index = TIME_OPTIONS.indexOf(currentTime);
      if (index >= 0) setSelectedIndex(index);
    } else if (!currentTime) {
      setSelectedIndex(-1);
    }
  }, [visible, currentTime]);

  const handleDone = () => {
    if (selectedIndex >= 0) {
      onSelect(TIME_OPTIONS[selectedIndex]);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface rounded-t-3xl overflow-hidden">
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-surface-overlay">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-txt-muted text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-txt-primary font-bold text-base">Select Time</Text>
            <TouchableOpacity onPress={handleDone}>
              <Text className="text-primary-500 font-bold text-base">Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="max-h-[300px]" showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((time, index) => (
              <TouchableOpacity
                key={time}
                className={`px-4 py-4 flex-row justify-between items-center ${
                  selectedIndex === index ? "bg-primary-500/10" : ""
                }`}
                onPress={() => setSelectedIndex(index)}
              >
                <Text className={`text-lg ${
                  selectedIndex === index ? "text-primary-500 font-bold" : "text-txt-primary"
                }`}>
                  {time}
                </Text>
                {selectedIndex === index && (
                  <Ionicons name="checkmark-circle" size={22} color="#1E88E5" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
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
  disabled = false
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  iconName: string;
  iconColor: string;
  disabled?: boolean;
}) => (
  <View className="flex-row items-center justify-between px-4 py-4 border-b border-surface-overlay">
    <View className="flex-row items-center gap-3 flex-1">
      <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: iconColor + "20" }}>
        <Ionicons name={iconName as any} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`text-base ${disabled ? "text-txt-muted" : "text-txt-primary"} font-semi`}>{title}</Text>
        {subtitle && <Text className="text-txt-muted text-xs mt-0.5">{subtitle}</Text>}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#30363D", true: "#1F6FEB" }}
      thumbColor="#F0F6FC"
      disabled={disabled}
    />
  </View>
);

const QuietHoursButton = ({
  label,
  time,
  onPress,
  disabled = false
}: {
  label: string;
  time?: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    className={`flex-1 px-4 py-4 rounded-xl flex-row items-center justify-between ${
      disabled ? "bg-surface/50" : "bg-surface-raised"
    }`}
    onPress={onPress}
    disabled={disabled}
  >
    <Text className={`text-base font-semi ${disabled ? "text-txt-muted" : "text-txt-primary"}`}>{label}</Text>
    <View className="flex-row items-center gap-2">
      <Text className={`text-sm ${disabled ? "text-txt-muted/50" : "text-txt-muted"}`}>
        {time || "Not set"}
      </Text>
      <Ionicons name="time-outline" size={18} color={disabled ? "#484F58" : "#8B949E"} />
    </View>
  </TouchableOpacity>
);

export default function NotificationSettingsScreen() {
  useAuthRedirect();
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

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

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
    if (success) {
      Alert.alert("Success", "Notification settings saved");
    } else {
      Alert.alert("Error", "Failed to save settings. Please try again.");
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!user?.id || hasChanges) return;
    setIsRefreshing(true);
    await loadPreferences(user.id);
    setIsRefreshing(false);
  }, [user?.id, hasChanges, loadPreferences]);

  const handleReset = async () => {
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
      ]
    );
  };

  const handleStartTimeSelect = (time: string) => {
    setLocalNotifications(prev => ({ ...prev, quietHoursStart: time }));
  };

  const handleEndTimeSelect = (time: string) => {
    setLocalNotifications(prev => ({ ...prev, quietHoursEnd: time }));
  };

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
            setIsRefreshing(prev => !prev);
          },
        },
      ]
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
      console.error(err);
    }
  };

  if (isLoadingPreferences && !user) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text className="text-txt-muted mt-4">Loading settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
          </TouchableOpacity>
          <Text className="text-txt-primary text-xl font-bold">Notifications</Text>
        </View>
        <View className="flex-row items-center gap-3">
          {hasChanges && (
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-txt-muted text-sm">Reset</Text>
            </TouchableOpacity>
          )}
          {isSyncing ? (
            <ActivityIndicator color="#1E88E5" size="small" />
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <Text className={`font-bold text-base ${hasChanges ? "text-primary-500" : "text-txt-muted"}`}>
                Save
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1E88E5"
          />
        }
      >
        <View className="px-5 py-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">GENERAL</Text>
          <View className="bg-surface rounded-2xl overflow-hidden border border-surface-border">
            <View className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-primary-500/20 items-center justify-center">
                  <Ionicons name="notifications" size={18} color="#388BFD" />
                </View>
                <View>
                  <Text className="text-txt-primary font-semi text-base">Push Notifications</Text>
                  <Text className="text-txt-muted text-xs">Receive notifications on your device</Text>
                </View>
              </View>
              <Switch
                value={localNotifications.pushEnabled}
                onValueChange={(val) => setLocalNotifications(prev => ({ ...prev, pushEnabled: val }))}
                trackColor={{ false: "#30363D", true: "#1F6FEB" }}
                thumbColor="#F0F6FC"
              />
            </View>
          </View>
        </View>

        <View className="px-5 pb-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">ANNOUNCEMENTS</Text>
          <View className="bg-surface rounded-2xl overflow-hidden border border-surface-border">
            <ToggleRow
              title="All Announcements"
              subtitle="Receive notifications for all announcements"
              value={localNotifications.announcementsEnabled}
              onValueChange={(val) => setLocalNotifications(prev => ({ ...prev, announcementsEnabled: val }))}
              iconName="megaphone"
              iconColor="#F57C00"
              disabled={!localNotifications.pushEnabled}
            />
            <ToggleRow
              title="League Announcements"
              subtitle="Long-term league updates and info"
              value={localNotifications.leagueAnnouncementsEnabled}
              onValueChange={(val) => setLocalNotifications(prev => ({ ...prev, leagueAnnouncementsEnabled: val }))}
              iconName="trophy"
              iconColor="#1E88E5"
              disabled={!localNotifications.pushEnabled || !localNotifications.announcementsEnabled}
            />
            <ToggleRow
              title="Game Announcements"
              subtitle="Game updates (weather, cancellations)"
              value={localNotifications.gameAnnouncementsEnabled}
              onValueChange={(val) => setLocalNotifications(prev => ({ ...prev, gameAnnouncementsEnabled: val }))}
              iconName="calendar"
              iconColor="#F57C00"
              disabled={!localNotifications.pushEnabled || !localNotifications.announcementsEnabled}
            />
            <ToggleRow
              title="PADA Organization"
              subtitle="Organization-wide announcements"
              value={localNotifications.padaOrgAnnouncementsEnabled}
              onValueChange={(val) => setLocalNotifications(prev => ({ ...prev, padaOrgAnnouncementsEnabled: val }))}
              iconName="business"
              iconColor="#7C3AED"
              disabled={!localNotifications.pushEnabled || !localNotifications.announcementsEnabled}
            />
          </View>
        </View>

        <View className="px-5 pb-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">GAMES & SCHEDULING</Text>
          <View className="bg-surface rounded-2xl overflow-hidden border border-surface-border">
            <ToggleRow
              title="Score Notifications"
              subtitle="Game score updates and results"
              value={localNotifications.scoreNotificationsEnabled}
              onValueChange={(val) => setLocalNotifications(prev => ({ ...prev, scoreNotificationsEnabled: val }))}
              iconName="ribbon"
              iconColor="#3FB950"
              disabled={!localNotifications.pushEnabled}
            />
            <ToggleRow
              title="Schedule Reminders"
              subtitle="Upcoming game and practice reminders"
              value={localNotifications.scheduleRemindersEnabled}
              onValueChange={(val) => setLocalNotifications(prev => ({ ...prev, scheduleRemindersEnabled: val }))}
              iconName="alarm"
              iconColor="#D29922"
              disabled={!localNotifications.pushEnabled}
            />
          </View>
        </View>

        <View className="px-5 pb-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">QUIET HOURS</Text>
          <View className="bg-surface rounded-2xl p-4 border border-surface-border gap-3">
            <Text className="text-txt-muted text-sm">Notifications will be silenced during these hours</Text>
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
                onPress={() => setLocalNotifications(prev => ({
                  ...prev,
                  quietHoursStart: undefined,
                  quietHoursEnd: undefined
                }))}
              >
                <Text className="text-danger text-sm font-semi">Clear Quiet Hours</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="px-5 pb-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">HIDDEN ANNOUNCEMENTS</Text>
          <View className="bg-surface rounded-2xl p-4 border border-surface-border gap-3">
            {hiddenCount > 0 ? (
              <>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-danger/10 items-center justify-center">
                      <Ionicons name="eye-off" size={18} color="#E53935" />
                    </View>
                    <View>
                      <Text className="text-txt-primary font-semi">{hiddenCount} hidden</Text>
                      <Text className="text-txt-muted text-xs">Announcements dismissed from feed</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  className="items-center py-3 border-t border-surface-overlay"
                  onPress={handleClearHiddenAnnouncements}
                >
                  <Text className="text-primary-400 text-sm font-semi">Show All Announcements</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-success/10 items-center justify-center">
                  <Ionicons name="checkmark-circle" size={18} color="#43A047" />
                </View>
                <Text className="text-txt-secondary text-sm">No hidden announcements</Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-5 pb-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">NOTIFICATION TEST</Text>
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 border border-surface-border flex-row items-center justify-center gap-3"
            onPress={handleTestNotification}
          >
            <Ionicons name="notifications" size={20} color="#1E88E5" />
            <Text className="text-primary-400 font-semi">Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {lastSyncTimestamp && (
          <View className="px-5 pb-4">
            <Text className="text-txt-muted text-xs text-center">
              Last synced: {new Date(lastSyncTimestamp).toLocaleString()}
            </Text>
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