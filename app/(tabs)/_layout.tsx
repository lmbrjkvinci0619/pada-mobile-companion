import React, { useCallback, useMemo } from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { useAnnouncements } from "@/hooks/useApi";

const TabBarBadge = React.memo(function TabBarBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View className="absolute -top-1 -right-1 min-w-4 h-4 bg-danger rounded-full items-center justify-center px-1">
      <Text className="text-white text-xs font-bold">{count > 9 ? "9+" : count}</Text>
    </View>
  );
});

function TabsLoading() {
  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <ActivityIndicator size="large" color="#1E88E5" />
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { data: announcements = [] } = useAnnouncements(user?.id || "");
  const unreadCount = useMemo(
    () => announcements.filter((a) => !a.isRead).length,
    [announcements]
  );

  if (isLoading) {
    return <TabsLoading />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const renderHomeIcon = useCallback(
    ({ color, size }: { color: string; size: number }) => (
      <View>
        <Ionicons name="home" size={size} color={color} />
        <TabBarBadge count={unreadCount} />
     </View>
    ),
    [unreadCount]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#161B22",
          borderTopColor: "#30363D",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#1E88E5",
        tabBarInactiveTintColor: "#8B949E",
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginTop: 2,
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
          title: "Registrations",
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
