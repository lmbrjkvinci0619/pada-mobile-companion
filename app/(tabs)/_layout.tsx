import React, { useCallback, useMemo } from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { useAnnouncements } from "@/hooks/useApi";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Body, EyebrowTight } from "@/components/ui";

const TabBarBadge = React.memo(function TabBarBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View className="absolute -top-1 -right-1 min-w-4 h-4 bg-danger items-center justify-center px-1" accessibilityLabel={`${count} unread`}>
      <Body tone="inverse" className="text-[10px] font-semibold">
        {count > 9 ? "9+" : count}
      </Body>
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
          backgroundColor: "#FFFFFF",
          borderTopColor: "#D8D8D8",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#00ABA9",
        tabBarInactiveTintColor: "#5C5C5C",
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontWeight: "600",
          fontSize: 10,
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
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tabs.Screen
        name="registrations"
        options={{
          title: "Register",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: "Teams",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}