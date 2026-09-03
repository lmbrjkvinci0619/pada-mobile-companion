import React, { useCallback, useMemo } from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { useAnnouncements } from "@/hooks/useApi";
import { useColors } from "@/lib/tokens";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { EyebrowTight } from "@/components/ui";

const TabBarBadge = React.memo(function TabBarBadge({ count }: { count: number }) {
  const colors = useColors();
  if (count === 0) return null;
  return (
    <View
      className="absolute -top-1 -right-1 min-w-4 h-4 items-center justify-center px-1"
      style={{ backgroundColor: colors.danger }}
      accessibilityLabel={`${count} unread`}
      accessibilityLiveRegion="polite"
    >
      <EyebrowTight style={{ color: colors.txtInverse }} className="text-[9px] tracking-[0.04em]">
        {count > 9 ? "9+" : count}
      </EyebrowTight>
    </View>
  );
});

function TabsLoading() {
  return (
    <View className="flex-1 bg-bg">
      <LoaderBar visible />
      <View className="flex-1 items-center justify-center">
        <EyebrowTight tone="muted" className="tracking-[0.2em]">loading</EyebrowTight>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { data: announcements = [] } = useAnnouncements(user?.id || "");
  const colors = useColors();
  const unreadCount = useMemo(
    () => announcements.filter((a) => !a.isRead).length,
    [announcements],
  );

  if (isLoading) return <TabsLoading />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  const renderHomeIcon = useCallback(
    ({ color, size }: { color: string; size: number }) => (
      <View>
        <Ionicons name="home" size={size} color={color} />
        <TabBarBadge count={unreadCount} />
      </View>
    ),
    [unreadCount],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.txtSecondary,
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontWeight: "600",
          fontSize: 11,
          marginTop: 2,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "home",
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: "My Registrations",
          tabBarAccessibilityLabel: "my registrations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: "Teams",
          tabBarAccessibilityLabel: "my teams",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarAccessibilityLabel: "schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}