import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchTeams } from "@/services/topscore";
import { Badge } from "@/components/ui/Badge";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import type { Team } from "@/types";

function TeamCard({ team }: { team: Team }) {
  const accentColor = team.color ?? "#1E88E5";
  return (
    <TouchableOpacity
      onPress={() => router.push(`/teams/${team.id}`)}
      className="mb-4"
    >
      <View
        className="rounded-2xl overflow-hidden border border-surface-overlay"
        style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}
      >
        <View className="bg-surface-raised px-4 py-4 gap-3">
          {/* Header */}
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-txt-primary text-lg font-bold" numberOfLines={1}>
                {team.name}
              </Text>
              {team.division && (
                <Text className="text-txt-secondary text-sm font-mid mt-0.5" numberOfLines={1}>
                  {team.division}
                </Text>
              )}
            </View>
            <Badge label="🥏 Ultimate" variant="disc" />
          </View>

          {/* Meta row */}
          <View className="flex-row items-center gap-4">
            {team.season && (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="leaf-outline" size={13} color="#8B949E" />
                <Text className="text-txt-muted text-xs font-mid">{team.season}</Text>
              </View>
            )}
            {team.roster && (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="people-outline" size={13} color="#8B949E" />
                <Text className="text-txt-muted text-xs font-mid">
                  {team.roster.length} members
                </Text>
              </View>
            )}
          </View>

          {/* Action row */}
          <View className="flex-row gap-2 pt-1">
            <TouchableOpacity
              onPress={() => router.push(`/teams/${team.id}?tab=roster`)}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-surface-overlay rounded-xl py-2"
            >
              <Ionicons name="people" size={14} color="#8B949E" />
              <Text className="text-txt-secondary text-xs font-semi">Roster</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/teams/${team.id}?tab=schedule`)}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-surface-overlay rounded-xl py-2"
            >
              <Ionicons name="calendar" size={14} color="#8B949E" />
              <Text className="text-txt-secondary text-xs font-semi">Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/teams/${team.id}?tab=chat`)}
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary-500/20 rounded-xl py-2"
            >
              <Ionicons name="chatbubbles" size={14} color="#64B5F6" />
              <Text className="text-primary-300 text-xs font-semi">Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TeamsScreen() {
  const [teams, setTeams]           = useState<Team[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await fetchTeams();
    setTeams(data);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-4 pb-4">
        <Text className="text-txt-primary text-2xl font-black">My Teams</Text>
        <Text className="text-txt-secondary text-sm font-mid mt-1">
          All teams you're currently registered with
        </Text>
      </View>

      <ReadOnlyBanner />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />
        }
      >
        {teams.length === 0 ? (
          <View className="mt-20 items-center gap-3">
            <Ionicons name="people-outline" size={48} color="#484F58" />
            <Text className="text-txt-muted text-base font-mid text-center">
              No teams found.{"\n"}Register on the Pada.org website.
            </Text>
          </View>
        ) : (
          teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
