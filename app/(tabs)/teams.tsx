import React, { useState, useCallback } from "react";
import { FlatList, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useTeams } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import type { Team } from "@/types";

const TeamCard = React.memo(function TeamCard({ team, onPress }: { team: Team; onPress: () => void }) {
  const accentColor = team.color ?? "#1F6FEB";
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-5 shadow-lg"
      activeOpacity={0.9}
    >
      <View className="rounded-3xl overflow-hidden bg-surface-raised border border-surface-border/40">
        <View className="p-5">
          <View className="flex-row items-center justify-between mb-4">
            <View
              className="px-2 py-1 rounded-lg mr-3"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Text style={{ color: accentColor }} className="text-[10px] font-black uppercase tracking-widest">
                {team.sport ?? "Ultimate"}
              </Text>
            </View>
            <Badge label={team.season ?? "Season"} variant="primary" />
          </View>

          <Text className="text-txt-primary text-2xl font-black mb-1" numberOfLines={1}>
            {team.name}
          </Text>
          <Text className="text-txt-secondary text-sm font-semi mb-4" numberOfLines={1}>
            {team.division ?? "Division Not Set"}
          </Text>

          <View className="flex-row items-center gap-4 mb-5 pt-4 border-t border-surface-overlay">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="people" size={14} color="#8B949E" />
              <Text className="text-txt-secondary text-xs font-bold">
                {team.roster?.length || 0} Members
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location" size={14} color="#8B949E" />
              <Text className="text-txt-secondary text-xs font-bold">PADA Org</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onPress}
              className="flex-1 bg-primary-500 rounded-2xl py-3 items-center justify-center shadow-md shadow-primary-500/20"
            >
              <Text className="text-white text-xs font-black uppercase tracking-wider">View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function TeamsScreen() {
  const { isAuthenticated } = useAuthStore();
  const { data: teams = [], isLoading, refetch } = useTeams();
  const [refreshing, setRefreshing] = useState(false);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="bg-gradient-to-b from-[#161B22] to-bg px-5 pt-6 pb-6 rounded-b-[40px]">
        <Text className="text-primary-300 text-xs font-bold tracking-[2px] uppercase mb-1">PADA.org</Text>
        <Text className="text-txt-primary text-3xl font-black">My Teams</Text>
        <Text className="text-txt-secondary text-sm font-semi mt-1 opacity-80">
          All teams you're currently registered with
        </Text>
      </View>

      <ReadOnlyBanner />

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeamCard
            team={item}
            onPress={() => router.push(`/teams/${item.id}`)}
          />
        )}
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />
        }
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View className="mt-20 items-center gap-3">
            <Ionicons name="people-outline" size={48} color="#484F58" />
            <Text className="text-txt-muted text-base font-mid text-center">
              No teams found.{"\n"}Register on the Pada.org website.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}