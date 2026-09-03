import React, { useState, useCallback } from "react";
import { FlatList, View, TouchableOpacity, RefreshControl } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useTeams } from "@/hooks/useApi";
import { useColors } from "@/lib/tokens";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { PageHeader } from "@/components/ui/Page";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { TeamName, Body, Eyebrow, Subtitle, EyebrowTight } from "@/components/ui";
import type { Team } from "@/types";

const TEAM_ACCENT_KEYS = ["primary", "secondary", "success", "warning", "magenta", "purple"] as const;
type AccentKey = (typeof TEAM_ACCENT_KEYS)[number];

function teamAccentKey(id: string): AccentKey {
  let code = 0;
  for (let i = 0; i < id.length; i++) code += id.charCodeAt(i);
  return TEAM_ACCENT_KEYS[code % TEAM_ACCENT_KEYS.length];
}

const TeamCard = React.memo(function TeamCard({ team, onPress }: { team: Team; onPress: () => void }) {
  const colors = useColors();
  const accent = team.color ?? colors[teamAccentKey(team.id)];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="mb-4">
      <Card variant="raised" className="overflow-hidden">
        <View style={{ backgroundColor: accent }}>
          <View className="p-4 flex-row items-start justify-between">
            <View className="flex-1">
              <EyebrowTight style={{ color: colors.txtInverse }} className="tracking-[0.2em]">
                {team.sport ?? "Ultimate"}
              </EyebrowTight>
              <TeamName style={{ color: colors.txtInverse }} numberOfLines={1}>
                {team.name.toLowerCase()}
              </TeamName>
            </View>
            {team.season && (
              <View className="px-3 py-0.5" style={{ backgroundColor: colors.surfaceRaised }}>
                <EyebrowTight style={{ color: colors.primary }}>{team.season}</EyebrowTight>
              </View>
            )}
          </View>
        </View>

        <Card.Content>
          <EyebrowTight tone="secondary">
            {team.division ?? "Division Not Set"}
          </EyebrowTight>

          <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-surface-border">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="people" size={14} color={colors.txtSecondary} />
              <Subtitle tone="secondary" className="font-semibold">
                {team.roster?.length || 0} members
              </Subtitle>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
});

export default function TeamsScreen() {
  const { isAuthenticated } = useAuthStore();
  const { data: teams = [], isLoading, refetch } = useTeams();
  const [refreshing, setRefreshing] = useState(false);
  const colors = useColors();

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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