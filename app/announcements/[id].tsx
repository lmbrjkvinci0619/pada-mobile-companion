import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { fetchAnnouncementById, markAnnouncementAsRead } from "@/services/announcements";
import { queryKeys } from "@/lib/queryKeys";
import type { Announcement, AnnouncementType } from "@/types";

const TYPE_COLORS: Record<AnnouncementType, { bg: string; text: string; label: string }> = {
  pada_org: { bg: "#7C3AED", text: "white", label: "PADA Organization" },
  league_longterm: { bg: "#1E88E5", text: "white", label: "League" },
  game: { bg: "#F57C00", text: "white", label: "Game" },
};

export default function AnnouncementDetail() {
  useAuthRedirect();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user?.id) {
      setError("Invalid announcement ID");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchAnnouncementById(id, user.id)
      .then(data => {
        if (cancelled) return;
        if (!data) {
          setError("Announcement not found");
          setIsLoading(false);
          return;
        }
        setAnnouncement(data);
        if (data.isRead) {
          setIsLoading(false);
          return;
        }
        markAnnouncementAsRead(id, user.id)
          .catch((err) => console.error("Failed to mark announcement as read:", err))
          .finally(() => {
            if (cancelled) return;
            queryClient.invalidateQueries({
              queryKey: queryKeys.announcements.all(user.id),
            });
            setIsLoading(false);
          });
      })
      .catch(err => {
        if (cancelled) return;
        setError("Failed to load announcement");
        console.error(err);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user?.id, queryClient]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Stack.Screen options={{ title: "Loading..." }} />
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  if (error || !announcement) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <Stack.Screen options={{ title: "Error" }} />
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle" size={48} color="#E53935" />
          <Text className="mt-2 text-danger">{error || "Unknown error"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = TYPE_COLORS[announcement.announcementType] || TYPE_COLORS.league_longterm;
  const isExpired = announcement.expiresAt && isPast(new Date(announcement.expiresAt));

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <Stack.Screen options={{ title: announcement.title }} />
      <ScrollView className="flex-1 px-5 pt-4">
        <View className="mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="px-2 py-1 rounded-md" style={{ backgroundColor: typeInfo.bg }}>
              <Text className="text-white text-xs font-bold">{typeInfo.label}</Text>
            </View>
            {announcement.isUrgent && (
              <TouchableOpacity className="rounded-full bg-danger/20 border border-danger/40 px-2 py-0.5">
                <Text className="text-xs font-semi text-danger">URGENT</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-2xl font-black text-txt-primary mb-2">{announcement.title}</Text>
          <View className="flex-row items-center">
            <Text className="text-sm text-txt-secondary">
              By {announcement.authorName} • {format(new Date(announcement.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </Text>
          </View>
        </View>

        {isExpired && (
          <View className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={18} color="#E53935" />
            <Text className="text-danger text-sm">This announcement has expired</Text>
          </View>
        )}

        <Text className="text-base leading-relaxed text-txt-primary whitespace-pre-wrap mb-6">
          {announcement.content}
        </Text>

        <View className="mt-6 bg-surface-raised rounded-2xl p-4 border border-surface-border gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-txt-secondary">Announcement Type</Text>
            <View className="px-2 py-1 rounded-md" style={{ backgroundColor: typeInfo.bg }}>
              <Text className="text-white text-xs font-bold">{typeInfo.label}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-txt-secondary">Audience</Text>
            <Text className="text-sm text-txt-primary">
              {announcement.targetType === "league" ? "League-wide" : announcement.targetType === "division" ? "Division" : "Team"}
            </Text>
          </View>
          {announcement.expiresAt && (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-txt-secondary">Expires</Text>
              <View className="flex-row items-center gap-1">
                {isExpired ? (
                  <Text className="text-sm text-danger">Expired</Text>
                ) : (
                  <>
                    <Ionicons name="time-outline" size={14} color="#8B949E" />
                    <Text className="text-sm text-txt-muted">
                      {formatDistanceToNow(new Date(announcement.expiresAt), { addSuffix: true })}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}