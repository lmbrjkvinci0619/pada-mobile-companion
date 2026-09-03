import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useSettingsStore } from "@/store/settingsStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader, SectionLabel, IconChip } from "@/components/ui/Page";
import { Title, Body, EyebrowTight } from "@/components/ui";
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Ionicons name="person-circle-outline" size={64} color="#8A8A8A" />
        <Body tone="muted" className="mt-4">
          Please log in to view settings
        </Body>
        <Button label="Log In" onPress={() => router.push("/(auth)/login")} className="mt-4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <PageHeader title="profile" subtitle="your account" back={() => router.back()} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6 items-center bg-surface border-b border-surface-border">
          <Avatar
            name={`${user?.firstName} ${user?.lastName}`}
            uri={user?.avatarUrl}
            size="xl"
            accent="#00ABA9"
          />

          {isEditing ? (
            <View className="mt-4 w-full">
              <TextInput
                className="bg-surface-raised border border-surface-border text-txt-primary text-center text-base px-4 py-3"
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
            <TouchableOpacity
              className="mt-4"
              onPress={() => setIsEditing(true)}
              accessibilityRole="button"
              accessibilityLabel="edit profile"
            >
              <Title tone="primary" size="sm" className="text-[20px]">
                {(localDisplayName || `${user?.firstName} ${user?.lastName}`).toLowerCase()}
              </Title>
              <View className="flex-row items-center justify-center gap-1 mt-1">
                <EyebrowTight tone="primaryAccent" className="tracking-[0.18em]">
                  edit profile
                </EyebrowTight>
                <Ionicons name="pencil" size={12} color="#00ABA9" />
              </View>
            </TouchableOpacity>
          )}

          <View className="bg-surface-overlay px-3 py-1 mt-3">
            <EyebrowTight tone="primaryAccent" className="text-[10px] tracking-[0.2em]">
              {user?.role}
            </EyebrowTight>
          </View>
          <Body tone="secondary" className="text-xs mt-2">
            {user?.email}
          </Body>
        </View>

        <View className="px-5 mt-5 pb-2">
          <SectionLabel>account</SectionLabel>
          <Card variant="default">
            <ListRow
              icon={<IconChip name="mail-outline" color="#1BA1E2" background="#1BA1E222" />}
              title="Email"
              subtitle={user?.email}
            />
            <ListRow
              icon={<IconChip name="call-outline" color="#339933" background="#33993322" />}
              title="Phone"
              subtitle="Not set"
              last
            />
          </Card>
        </View>

        <View className="px-5 mt-5 pb-2">
          <SectionLabel>preferences</SectionLabel>
          <Card variant="default">
            <ListRow
              icon={<IconChip name="notifications-outline" color="#F09609" background="#F0960922" />}
              title="Notifications"
              subtitle="Manage push and in-app notifications"
              onPress={() => router.push("/settings/notifications")}
            />
            <ListRow
              icon={<IconChip name="language-outline" color="#339933" background="#33993322" />}
              title="Language"
              subtitle="English"
            />
            <ListRow
              icon={<IconChip name="time-outline" color="#1BA1E2" background="#1BA1E222" />}
              title="Timezone"
              subtitle="Automatic"
              last
            />
          </Card>
        </View>

        <View className="px-5 mt-5 pb-2">
          <SectionLabel>support</SectionLabel>
          <Card variant="default">
            <ListRow
              icon={<IconChip name="help-circle-outline" color="#F09609" background="#F0960922" />}
              title="Help Center"
              subtitle="FAQs and support articles"
              onPress={() => openUrl(EXTERNAL_URLS.help)}
            />
            <ListRow
              icon={<IconChip name="chatbubbles-outline" color="#E51400" background="#E5140022" />}
              title="Contact Support"
              subtitle="Get help from our team"
              onPress={() => openUrl(EXTERNAL_URLS.supportEmail)}
            />
            <ListRow
              icon={<IconChip name="document-text-outline" color="#5C5C5C" background="#5C5C5C22" />}
              title="Terms of Service"
              subtitle="Read our terms"
              onPress={() => openUrl(EXTERNAL_URLS.terms)}
            />
            <ListRow
              icon={<IconChip name="shield-outline" color="#5C5C5C" background="#5C5C5C22" />}
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() => openUrl(EXTERNAL_URLS.privacy)}
              last
            />
          </Card>
        </View>

        <View className="px-5 pb-8 mt-5">
          <Button variant="ghost" label="Log Out" onPress={handleLogout} className="border-danger" />
        </View>

        <View className="items-center pb-8">
          <EyebrowTight tone="muted" className="tracking-[0.2em]">
            pada mobile companion v1.0.0
          </EyebrowTight>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}