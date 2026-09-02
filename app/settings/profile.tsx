import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useSettingsStore } from "@/store/settingsStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionLabel, IconChip } from "@/components/ui/Page";
import { EXTERNAL_URLS, openUrl } from "@/lib/urlUtils";

export default function UserSettingsScreen() {
  useAuthRedirect();
  const { user, isAuthenticated } = useAuthStore();
  const { displayName, setDisplayName } = useSettingsStore();

  const [localDisplayName, setLocalDisplayName] = useState(displayName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (displayName) setLocalDisplayName(displayName);
    else if (user) setLocalDisplayName(`${user.firstName} ${user.lastName}`.trim());
  }, [displayName, user]);

  useEffect(() => {
    setHasChanges(localDisplayName !== (displayName || `${user?.firstName} ${user?.lastName}`.trim()));
  }, [localDisplayName, displayName, user]);

  const handleSave = () => {
    if (!localDisplayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty");
      return;
    }
    setDisplayName(localDisplayName.trim());
    setIsEditing(false);
    setHasChanges(false);
    Alert.alert("Success", "Display name updated");
  };

  const handleCancel = () => {
    setLocalDisplayName(displayName || `${user?.firstName} ${user?.lastName}`.trim());
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: () => useAuthStore.getState().logout() },
      ],
    );
  };

  const SettingRow = ({
    title,
    subtitle,
    onPress,
    showChevron = true,
    danger = false,
    children,
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
    children?: React.ReactNode;
  }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between px-4 py-4 border-b-2 border-surface-border"
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View className="flex-row items-center gap-3 flex-1">
        {children}
        <View className="flex-1">
          <Text className={`text-sm font-bold ${danger ? "text-danger" : "text-txt-primary"}`}>{title}</Text>
          {subtitle && <Text className="text-txt-secondary text-xs mt-0.5">{subtitle}</Text>}
        </View>
      </View>
      {showChevron && onPress && <Ionicons name="chevron-forward" size={18} color="#5C5C5C" />}
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Ionicons name="person-circle-outline" size={64} color="#8A8A8A" />
        <Text className="text-txt-muted mt-4">Please log in to view settings</Text>
        <Button label="Log In" onPress={() => router.push("/(auth)/login")} className="mt-4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <PageHeader title="profile" subtitle="account & privacy" back={() => router.back()} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6 items-center bg-surface border-b-2 border-surface-border">
          <Avatar
            name={`${user?.firstName} ${user?.lastName}`}
            uri={user?.avatarUrl}
            size="xl"
            border
            accent="#00ABA9"
          />

          {isEditing ? (
            <View className="mt-4 w-full">
              <TextInput
                className="bg-surface-raised border-2 border-surface-border text-txt-primary text-center text-base px-4 py-3"
                value={localDisplayName}
                onChangeText={setLocalDisplayName}
                placeholder="Enter display name"
                placeholderTextColor="#8A8A8A"
                autoFocus
              />
              <View className="flex-row gap-3 mt-3">
                <Button variant="ghost" label="Cancel" onPress={handleCancel} className="flex-1" />
                <Button label="Save" onPress={handleSave} disabled={!hasChanges || isSaving} className="flex-1" />
              </View>
            </View>
          ) : (
            <TouchableOpacity className="mt-4" onPress={() => setIsEditing(true)}>
              <Text className="text-txt-primary text-xl font-bold lowercase tracking-tight">
                {localDisplayName || `${user?.firstName} ${user?.lastName}`}
              </Text>
              <View className="flex-row items-center justify-center gap-1 mt-1">
                <Text className="text-primary text-[11px] font-bold uppercase tracking-[0.18em]">Edit profile</Text>
                <Ionicons name="pencil" size={12} color="#00ABA9" />
              </View>
            </TouchableOpacity>
          )}

          <View className="bg-primary-50 border-2 border-primary px-3 py-1 mt-3">
            <Text className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">{user?.role}</Text>
          </View>
          <Text className="text-txt-secondary text-xs mt-2">{user?.email}</Text>
        </View>

        <View className="px-5 mt-5 pb-2">
          <SectionLabel>account</SectionLabel>
          <View className="bg-surface border-2 border-surface-border">
            <SettingRow title="Email" subtitle={user?.email} showChevron={false}>
              <IconChip name="mail-outline" color="#1BA1E2" background="#1BA1E222" />
            </SettingRow>
            <SettingRow title="Phone" subtitle="Not set" showChevron={false}>
              <IconChip name="call-outline" color="#339933" background="#33993322" />
            </SettingRow>
          </View>
        </View>

        <View className="px-5 mt-5 pb-2">
          <SectionLabel>preferences</SectionLabel>
          <View className="bg-surface border-2 border-surface-border">
            <SettingRow title="Notifications" subtitle="Manage push and in-app notifications" onPress={() => router.push("/settings/notifications")}>
              <IconChip name="notifications-outline" color="#F09609" background="#F0960922" />
            </SettingRow>
            <SettingRow title="Language" subtitle="English" showChevron={false}>
              <IconChip name="language-outline" color="#339933" background="#33993322" />
            </SettingRow>
            <SettingRow title="Timezone" subtitle="Automatic" showChevron={false}>
              <IconChip name="time-outline" color="#1BA1E2" background="#1BA1E222" />
            </SettingRow>
          </View>
        </View>

        <View className="px-5 mt-5 pb-2">
          <SectionLabel>support</SectionLabel>
          <View className="bg-surface border-2 border-surface-border">
            <SettingRow title="Help Center" subtitle="FAQs and support articles" onPress={() => openUrl(EXTERNAL_URLS.help)}>
              <IconChip name="help-circle-outline" color="#F09609" background="#F0960922" />
            </SettingRow>
            <SettingRow title="Contact Support" subtitle="Get help from our team" onPress={() => openUrl(EXTERNAL_URLS.supportEmail)}>
              <IconChip name="chatbubbles-outline" color="#E51400" background="#E5140022" />
            </SettingRow>
            <SettingRow title="Terms of Service" subtitle="Read our terms" onPress={() => openUrl(EXTERNAL_URLS.terms)}>
              <IconChip name="document-text-outline" color="#5C5C5C" background="#5C5C5C22" />
            </SettingRow>
            <SettingRow title="Privacy Policy" subtitle="How we handle your data" onPress={() => openUrl(EXTERNAL_URLS.privacy)}>
              <IconChip name="shield-outline" color="#5C5C5C" background="#5C5C5C22" />
            </SettingRow>
          </View>
        </View>

        <View className="px-5 pb-8 mt-5">
          <Button variant="ghost" label="Log Out" onPress={handleLogout} className="border-danger" />
        </View>

        <View className="items-center pb-8">
          <Text className="text-txt-muted text-[11px] font-bold uppercase tracking-[0.2em]">PADA Mobile Companion v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}