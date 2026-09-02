import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTeam, useEvents } from "@/hooks/useApi";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import type { TeamMember, Event } from "@/types";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/Page";
import { Pivot, PivotContent } from "@/components/ui/Pivot";
import { format, parseISO } from "date-fns";
import { RefreshControl } from "react-native";

type TeamTab = "roster" | "schedule";

export default function TeamDetailScreen() {
  useAuthRedirect();
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { data: team, isLoading: teamLoading, refetch: refetchTeam } = useTeam(id);
  const { data: events = [], refetch: refetchEvents } = useEvents({ teamId: id });

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TeamTab>(
    tab === "schedule" ? "schedule" : "roster",
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => (e.status === "scheduled" || e.status === "in_progress") && e.startDate)
        .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "")),
    [events],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTeam(), refetchEvents()]);
    setRefreshing(false);
  };

  if (teamLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#00ABA9" />
      </SafeAreaView>
    );
  }

  if (!team) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-txt-muted">Team not found</Text>
      </SafeAreaView>
    );
  }

  const recordText = team.wins !== undefined
    ? `${team.wins}W - ${team.losses}L${team.ties ? ` - ${team.ties}T` : ""}`
    : "";

  const nextEvent = upcomingEvents[0];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <PageHeader
        title="team"
        back={() => router.back()}
        subtitle={team.season ?? "season"}
        right={team.season ? <Badge label={team.season} variant="primary" /> : undefined}
      />

      <View className="px-5 pt-4 pb-5 bg-primary border-b-2 border-primary-700">
        <Text className="text-txt-inverse text-3xl font-light lowercase tracking-tight">
          {team.name}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-txt-inverse/80 text-[11px] font-bold uppercase tracking-[0.2em]">
            {team.division}
          </Text>
          {recordText && (
            <View className="bg-white px-3 py-1">
              <Text className="text-txt-primary text-[10px] font-bold uppercase tracking-wider">{recordText}</Text>
            </View>
          )}
        </View>
      </View>

      <ReadOnlyBanner />

      {nextEvent && (
        <TouchableOpacity
          className="mx-5 mb-3 bg-danger border-2 border-danger p-4 flex-row items-center gap-4"
          onPress={() => router.push(`/events/${nextEvent.id}`)}
          activeOpacity={0.85}
        >
          <View className="w-12 h-12 bg-white items-center justify-center">
            <Ionicons name="flash" size={24} color="#E51400" />
          </View>
          <View className="flex-1">
            <Text className="text-txt-inverse text-[10px] font-bold uppercase tracking-[0.2em]">
              {nextEvent.status === "in_progress" ? "Live Now" : "Next Match"}
            </Text>
            <Text className="text-txt-inverse text-base font-bold mt-0.5" numberOfLines={1}>
              vs {nextEvent.opponentName || "TBD"}
            </Text>
            {nextEvent.score && (
              <Text className="text-txt-inverse/90 text-xs font-bold mt-0.5">
                Live: {nextEvent.score.homeScore} – {nextEvent.score.awayScore}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <Pivot
        items={[
          { key: "roster", label: "roster" },
          { key: "schedule", label: "schedule" },
        ]}
        value={activeTab}
        onChange={(k) => setActiveTab(k)}
      />

      <PivotContent>
        <FlatList
          className="flex-1"
          contentContainerClassName="px-5 py-4"
          data={(activeTab === "roster" ? team.roster ?? [] : events) as any[]}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />}
          renderItem={({ item }) => {
            if (activeTab === "roster") {
              const member = item as TeamMember;
              return (
                <View className="flex-row items-center bg-surface border-2 border-surface-border p-4 mb-3">
                  <Avatar
                    name={`${member.firstName} ${member.lastName}`}
                    uri={member.avatarUrl}
                    size="md"
                    accent="#00ABA9"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-txt-primary font-bold text-sm">
                      {member.firstName} {member.lastName}
                    </Text>
                    <View className="bg-primary-50 border-2 border-primary self-start mt-1 px-2 py-0.5">
                      <Text className="text-primary text-[10px] font-bold uppercase tracking-wider">{member.role}</Text>
                    </View>
                  </View>
                  {member.jerseyNumber != null && (
                    <View className="w-10 h-10 bg-surface-overlay items-center justify-center border-2 border-surface-border">
                      <Text className="text-txt-primary font-bold">{member.jerseyNumber}</Text>
                    </View>
                  )}
                </View>
              );
            }
            const ev = item as Event;
            return (
              <TouchableOpacity
                className="bg-surface border-2 border-surface-border p-4 mb-3"
                onPress={() => router.push(`/events/${ev.id}`)}
                activeOpacity={0.85}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Badge label={ev.startDate ? format(parseISO(ev.startDate), "MMM d") : "TBD"} variant="ghost" />
                  <Text className="text-txt-secondary text-[10px] font-bold uppercase tracking-wider">
                    {ev.startDate ? format(parseISO(ev.startDate), "h:mm a") : ""}
                  </Text>
                </View>
                <Text className="text-txt-primary font-bold text-base mb-1">
                  vs {ev.opponentName || "TBD"}
                </Text>
                <Text className="text-txt-secondary text-xs mb-3">{ev.title}</Text>

                {ev.score && (
                  <View className="bg-surface-overlay border-2 border-surface-border p-3 flex-row justify-between items-center">
                    <Text className="text-txt-primary font-bold text-sm" numberOfLines={1}>
                      {ev.score.homeTeamName || "Home"}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-txt-primary font-bold text-xl">{ev.score.homeScore}</Text>
                      <Text className="text-txt-muted">—</Text>
                      <Text className="text-txt-primary font-bold text-xl">{ev.score.awayScore}</Text>
                    </View>
                    <Text className="text-txt-secondary text-xs font-bold" numberOfLines={1}>
                      {ev.score.awayTeamName || "Away"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </PivotContent>
    </SafeAreaView>
  );
}