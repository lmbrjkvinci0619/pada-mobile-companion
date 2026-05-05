import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { fetchAnnouncementById, markAnnouncementAsRead } from "@/services/announcements";
import type { Announcement } from "@/types";

export default function AnnouncementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user?.id) {
      setError("Invalid announcement ID");
      setIsLoading(false);
      return;
    }

    fetchAnnouncementById(id)
      .then(data => {
        if (!data) {
          setError("Announcement not found");
        } else {
          setAnnouncement(data);
          if (user?.id) {
            markAnnouncementAsRead(id, user.id).catch(console.error);
          }
        }
      })
      .catch(err => {
        setError("Failed to load announcement");
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [id, user?.id]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen options={{ title: "Loading..." }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !announcement) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Stack.Screen options={{ title: "Error" }} />
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="mt-2 text-red-500">{error || "Unknown error"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ title: announcement.title }} />
      <ScrollView className="flex-1 p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900">{announcement.title}</Text>
          <View className="mt-2 flex-row items-center">
            <Text className="text-sm text-gray-500">
              By {announcement.authorName} • {new Date(announcement.createdAt).toLocaleDateString()}
            </Text>
            {announcement.isUrgent && (
              <TouchableOpacity className="ml-2 rounded bg-red-100 px-2 py-0.5">
                <Text className="text-xs font-semibold text-red-600">URGENT</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
          {announcement.content}
        </Text>

        {announcement.targetType && (
          <View className="mt-6 rounded-lg bg-gray-50 p-3">
            <Text className="text-sm text-gray-500">
              Posted for: {announcement.targetType === "league" ? "League" : announcement.targetType === "division" ? "Division" : "Team"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}