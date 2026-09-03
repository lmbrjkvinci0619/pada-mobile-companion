import React, { useState, useCallback } from "react";
import { FlatList, View, TouchableOpacity, RefreshControl } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useTeams } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { PageHeader } from "@/components/ui/Page";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Section, Body, Eyebrow, Subtitle, EyebrowTight } from "@/components/ui";
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
      <View className="bg-surface-raised border border-surface-border">
        <View className="flex-row" style={{ backgroundColor: accent }}>
          <View className="flex-1 p-4">
            <Eyebrow tone="inverse" className="text-[10px] tracking-[0.2em]">
              {team.sport ?? "Ultimate"}
            </Eyebrow>
            <Section tone="inverse" numberOfLines={1} className="text-2xl mt-1">
              {team.name}
            </Section>
          </View>
          {team.season && (
            <View className="bg-white px-3 self-start m-3">
              <EyebrowTight tone="primary">{team.season}</EyebrowTight>
            </View>
          )}
        </View>

        <View className="p-4">
          <EyebrowTight tone="secondary">
            {team.division ?? "Division Not Set"}
          </EyebrowTight>

          <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-surface-border">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="people" size={14} color="#5C5C5C" />
              <Subtitle tone="secondary" className="font-semibold">
                {team.roster?.length || 0} members
              </Subtitle>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location" size={14} color="#5C5C5C" />
              <EyebrowTight tone="secondary">PADA</EyebrowTight>
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
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <PageHeader title="my teams" subtitle="pada.org" />
        <ReadOnlyBanner />
        <LoaderBar visible />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <PageHeader title="my teams" subtitle="pada.org" />

      <ReadOnlyBanner />
      <LoaderBar visible={refreshing} />

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
          <View className="mt-8">
            <EmptyState
              icon="people-outline"
              title="no teams found"
              subtitle="Register on the pada.org website to see your teams here."
              accent="muted"
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}