import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { fetchAnnouncementById, markAnnouncementAsRead } from "@/services/announcements";
import { useAuthStore } from "@/store/authStore";
import { Announcement } from "@/types";

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAnnouncementById(id).then(data => {
        setAnnouncement(data);
        setIsLoading(false);
        if (data && user?.id) {
          markAnnouncementAsRead(id, user.id);
        }
      });
    }
  }, [id, user?.id]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
         <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  if (!announcement) return null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
        </TouchableOpacity>
        <Text className="text-txt-primary text-xl font-bold flex-1" numberOfLines={1}>Announcement</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        {announcement.isUrgent && (
           <View className="mb-3 self-start">
              <Badge label="Urgent" variant="danger" />
           </View>
        )}
        <Text className="text-txt-primary text-2xl font-black mb-2">{announcement.title}</Text>
        
        <View className="flex-row items-center gap-2 mb-6 border-b border-surface-overlay pb-4">
           <Ionicons name="person-circle-outline" size={24} color="#8B949E" />
           <View>
              <Text className="text-txt-secondary font-bold text-sm">{announcement.authorName}</Text>
              <Text className="text-txt-muted text-xs">
                 {format(new Date(announcement.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </Text>
           </View>
        </View>

        <Card elevated className="p-5">
           <Text className="text-txt-primary text-base leading-6">{announcement.content}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
