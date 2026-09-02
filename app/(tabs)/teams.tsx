import React, { useState, useCallback } from "react";
import { FlatList, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useTeams } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { PageHeader } from "@/components/ui/Page";
import type { Team } from "@/types";

const TEAM_ACCENTS = ["#00ABA9", "#1BA1E2", "#339933", "#F09609", "#D80073", "#A200FF"];

function teamAccent(id: string): string {
  let code = 0;
  for (let i = 0; i < id.length; i++) code += id.charCodeAt(i);
  return TEAM_ACCENTS[code % TEAM_ACCENTS.length];
}

const TeamCard = React.memo(function TeamCard({ team, onPress }: { team: Team; onPress: () => void }) {
  const accent = team.color ?? teamAccent(team.id);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="mb-4">
      <View className="bg-surface-raised border-2 border-surface-border">
        <View className="flex-row" style={{ backgroundColor: accent }}>
          <View className="flex-1 p-4">
            <Text className="text-txt-inverse text-[10px] font-bold uppercase tracking-[0.2em]">
              {team.sport ?? "Ultimate"}
            </Text>
            <Text className="text-txt-inverse text-2xl font-light lowercase tracking-tight mt-1" numberOfLines={1}>
              {team.name}
            </Text>
          </View>
          {team.season && (
            <View className="bg-white px-3 self-start m-3">
              <Text className="text-txt-primary text-[10px] font-bold uppercase tracking-wider">
                {team.season}
              </Text>
            </View>
          )}
        </View>

        <View className="p-4">
          <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-wider">
            {team.division ?? "Division Not Set"}
          </Text>

          <View className="flex-row items-center gap-4 mt-3 pt-3 border-t-2 border-surface-border">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="people" size={14} color="#5C5C5C" />
              <Text className="text-txt-secondary text-xs font-bold">
                {team.roster?.length || 0} members
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location" size={14} color="#5C5C5C" />
              <Text className="text-txt-secondary text-xs font-bold uppercase tracking-wider">PADA</Text>
            </View>
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
        <ActivityIndicator size="large" color="#00ABA9" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <PageHeader title="my teams" subtitle="pada.org" />

      <ReadOnlyBanner />

      <FlatList
        data={teams}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeamCard team={item} onPress={() => router.push(`/teams/${item.id}`)} />
        )}
        contentContainerClassName="px-5 pb-8 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />
        }
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={
          <View className="mt-20 items-center gap-3">
            <Ionicons name="people-outline" size={48} color="#8A8A8A" />
            <Text className="text-txt-secondary text-sm font-bold text-center lowercase">
              no teams found.{"\n"}register on the pada.org website.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}