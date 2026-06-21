import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export default function UserSettingsScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { displayName, setDisplayName } = useSettingsStore();
  
  const [localDisplayName, setLocalDisplayName] = useState(displayName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (displayName) {
      setLocalDisplayName(displayName);
    } else if (user) {
      setLocalDisplayName(`${user.firstName} ${user.lastName}`.trim());
    }
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
      ]
    );
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    danger = false,
    children 
  }: { 
    title: string; 
    subtitle?: string; 
    onPress?: () => void;
    showChevron?: boolean;
    danger?: boolean;
    children?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      className="flex-row items-center justify-between px-4 py-4 border-b border-surface-overlay"
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View className="flex-row items-center gap-3 flex-1">
        {children && <View className="mr-3">{children}</View>}
        <View className="flex-1">
          <Text className={`text-base ${danger ? "text-danger" : "text-txt-primary"} font-semi`}>{title}</Text>
          {subtitle && <Text className="text-txt-muted text-xs mt-0.5">{subtitle}</Text>}
        </View>
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={18} color="#484F58" />
      )}
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Ionicons name="person-circle-outline" size={64} color="#484F58" />
        <Text className="text-txt-muted mt-4">Please log in to view settings</Text>
        <Button 
          label="Log In" 
          onPress={() => router.push("/(auth)/login")}
          className="mt-4"
        />
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
          <Text className="text-txt-primary text-xl font-bold">Profile</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-5 py-6 items-center">
          <Avatar 
            name={`${user?.firstName} ${user?.lastName}`}
            uri={user?.avatarUrl}
            size="xl"
            className="border-4 border-primary-500/20"
          />
          
          {isEditing ? (
            <View className="mt-4 w-full">
              <TextInput
                className="bg-surface-raised border border-surface-overlay text-txt-primary text-center text-lg px-4 py-3 rounded-xl"
                value={localDisplayName}
                onChangeText={setLocalDisplayName}
                placeholder="Enter display name"
                placeholderTextColor="#8B949E"
                autoFocus
              />
              <View className="flex-row gap-3 mt-3">
                <Button 
                  variant="ghost" 
                  label="Cancel" 
                  onPress={handleCancel}
                  className="flex-1"
                />
                <Button 
                  label="Save" 
                  onPress={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex-1"
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity className="mt-4" onPress={() => setIsEditing(true)}>
              <Text className="text-txt-primary text-xl font-bold">
                {localDisplayName || `${user?.firstName} ${user?.lastName}`}
              </Text>
              <View className="flex-row items-center justify-center gap-1 mt-1">
                <Text className="text-primary-500 text-sm">Edit profile</Text>
                <Ionicons name="pencil" size={14} color="#1E88E5" />
              </View>
            </TouchableOpacity>
          )}
          
          <View className="bg-surface-raised px-4 py-2 rounded-2xl mt-3 border border-primary-500/20">
            <Text className="text-primary-200 text-[10px] font-black uppercase tracking-wider">{user?.role}</Text>
          </View>
          <Text className="text-txt-muted text-sm mt-2">{user?.email}</Text>
        </View>

        <View className="px-5 pb-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">ACCOUNT</Text>
          <View className="bg-surface rounded-2xl overflow-hidden border border-surface-border">
            <SettingRow
              title="Email"
              subtitle={user?.email}
              showChevron={false}
            >
              <View className="w-8 h-8 rounded-lg bg-primary-500/20 items-center justify-center">
                <Ionicons name="mail-outline" size={16} color="#388BFD" />
              </View>
            </SettingRow>
            <SettingRow
              title="Phone"
              subtitle="Not set"
              showChevron={false}
            >
              <View className="w-8 h-8 rounded-lg bg-accent/20 items-center justify-center">
                <Ionicons name="call-outline" size={16} color="#3FB950" />
              </View>
            </SettingRow>
          </View>
        </View>

        <View className="px-5 pb-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">PREFERENCES</Text>
          <View className="bg-surface rounded-2xl overflow-hidden border border-surface-border">
            <SettingRow
              title="Notifications"
              subtitle="Manage push and in-app notifications"
              onPress={() => router.push("/settings/notifications")}
            >
              <View className="w-8 h-8 rounded-lg bg-warning/20 items-center justify-center">
                <Ionicons name="notifications-outline" size={16} color="#D29922" />
              </View>
            </SettingRow>
            <SettingRow
              title="Language"
              subtitle="English"
              showChevron={false}
            >
              <View className="w-8 h-8 rounded-lg bg-accent/20 items-center justify-center">
                <Ionicons name="language-outline" size={16} color="#3FB950" />
              </View>
            </SettingRow>
            <SettingRow
              title="Timezone"
              subtitle="Automatic"
              showChevron={false}
            >
              <View className="w-8 h-8 rounded-lg bg-primary-500/20 items-center justify-center">
                <Ionicons name="time-outline" size={16} color="#388BFD" />
              </View>
            </SettingRow>
          </View>
        </View>

        <View className="px-5 pb-4">
          <Text className="text-txt-secondary text-xs font-bold uppercase mb-3">SUPPORT</Text>
          <View className="bg-surface rounded-2xl overflow-hidden border border-surface-border">
            <SettingRow
              title="Help Center"
              subtitle="FAQs and support articles"
              onPress={() => {}}
            >
              <View className="w-8 h-8 rounded-lg bg-warning/20 items-center justify-center">
                <Ionicons name="help-circle-outline" size={16} color="#D29922" />
              </View>
            </SettingRow>
            <SettingRow
              title="Contact Support"
              subtitle="Get help from our team"
              onPress={() => {}}
            >
              <View className="w-8 h-8 rounded-lg bg-danger/20 items-center justify-center">
                <Ionicons name="chatbubbles-outline" size={16} color="#E53935" />
              </View>
            </SettingRow>
            <SettingRow
              title="Terms of Service"
              subtitle="Read our terms"
              onPress={() => {}}
            >
              <View className="w-8 h-8 rounded-lg bg-surface-raised items-center justify-center">
                <Ionicons name="document-text-outline" size={16} color="#8B949E" />
              </View>
            </SettingRow>
            <SettingRow
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() => {}}
            >
              <View className="w-8 h-8 rounded-lg bg-surface-raised items-center justify-center">
                <Ionicons name="shield-outline" size={16} color="#8B949E" />
              </View>
            </SettingRow>
          </View>
        </View>

        <View className="px-5 pb-8">
          <Button 
            variant="ghost" 
            label="Log Out" 
            onPress={handleLogout}
            className="border-danger/30"
          />
        </View>

        <View className="items-center pb-8">
          <Text className="text-txt-muted text-xs">PADA Mobile Companion v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}