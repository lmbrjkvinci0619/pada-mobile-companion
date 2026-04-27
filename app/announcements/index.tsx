import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { format, parseISO } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/authStore";
import { fetchAnnouncements } from "@/services/announcements";
import { Announcement } from "@/types";

export default function AnnouncementsListScreen() {
  const { user } = useAuthStore();
  const canPost = user?.role === "league_admin" || user?.role === "captain";
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (user?.id) {
      const data = await fetchAnnouncements(user.id);
      setAnnouncements(data);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setIsLoading(false));
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center justify-between">
         <View className="flex-row items-center gap-3">
           <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
           </TouchableOpacity>
          <Text className="text-txt-primary text-2xl font-black">Announcements</Text>
         </View>
         {canPost && (
            <TouchableOpacity onPress={() => router.push("/announcements/create")}>
               <Ionicons name="create-outline" size={24} color="#1E88E5" />
            </TouchableOpacity>
         )}
      </View>
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      ) : (
        <FlatList
          data={announcements}
          contentContainerClassName="px-5 py-4 gap-4"
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center pt-10">
              <Text className="text-txt-muted">No announcements yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-surface rounded-2xl p-4 gap-2"
              onPress={() => router.push(`/announcements/${item.id}`)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                   {!item.isRead && <View className="w-2 h-2 rounded-full bg-primary-500" />}
                   {item.isUrgent && <Badge label="Urgent" variant="danger" />}
                   <Text className="text-txt-secondary text-xs">{format(new Date(item.createdAt), "MMM d, yyyy")}</Text>
                </View>
              </View>
              <Text className="text-txt-primary font-bold text-base">{item.title}</Text>
              <Text className="text-txt-muted text-sm" numberOfLines={2}>{item.content}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
