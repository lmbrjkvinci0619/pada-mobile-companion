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
import { format, parseISO } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { RefreshControl } from "react-native";

type TeamTab = "roster" | "schedule";

export default function TeamDetailScreen() {
  useAuthRedirect();
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const { data: team, isLoading: teamLoading, refetch: refetchTeam } = useTeam(id);
  const { data: events = [], refetch: refetchEvents } = useEvents({ teamId: id });

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TeamTab>(
    tab === "schedule" ? "schedule" : "roster"
  );

  const upcomingEvents = useMemo(
    () => events
      .filter(e => (e.status === "scheduled" || e.status === "in_progress") && e.startDate)
      .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "")),
    [events]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTeam(), refetchEvents()]);
    setRefreshing(false);
  };

  if (teamLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1E88E5" />
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

  const recordText = (team.wins !== undefined)
    ? `${team.wins}W - ${team.losses}L${team.ties ? ` - ${team.ties}T` : ""}`
    : "";

  const nextEvent = upcomingEvents[0];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <LinearGradient
        colors={["#161B22", "#0D1117"]}
        className="px-5 pt-4 pb-8 rounded-b-[40px] shadow-2xl"
      >
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface-overlay items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#F0F6FC" />
    </TouchableOpacity>
          <Badge label={team.season ?? "Season"} variant="primary" />
  </View>

        <Text className="text-txt-primary text-3xl font-black mb-1">{team.name}</Text>
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-primary-300 text-sm font-bold opacity-80">{team.division}</Text>
          {recordText ? (
            <View className="bg-surface-overlay px-3 py-1 rounded-full border border-surface-border/30">
              <Text className="text-txt-primary text-[10px] font-black">{recordText}</Text>
      </View>
          ) : null}
  </View>

        <ReadOnlyBanner />

        {nextEvent && (
          <TouchableOpacity
            className="bg-surface-raised border border-surface-border/40 rounded-3xl p-4 flex-row items-center gap-4 shadow-sm"
            onPress={() => router.push(`/events/${nextEvent.id}`)}
          >
            <View className="w-12 h-12 rounded-2xl bg-primary-500 items-center justify-center">
              <Ionicons name="flash" size={24} color="#fff" />
      </View>
            <View className="flex-1">
              <Text className="text-primary-200 text-[10px] font-black uppercase tracking-[2px]">
                {nextEvent.status === "in_progress" ? "Live Now" : "Next Match"}
        </Text>
              <Text className="text-txt-primary text-sm font-black" numberOfLines={1}>
                vs {nextEvent.opponentName || "TBD"}
        </Text>
              {nextEvent.score && (
                <Text className="text-accent font-black text-xs mt-0.5">
                  Live: {nextEvent.score.homeScore} - {nextEvent.score.awayScore}
        </Text>
              )}
      </View>
            <Ionicons name="chevron-forward" size={16} color="#484F58" />
    </TouchableOpacity>
        )}
</LinearGradient>

      <View className="flex-row px-5 mt-6 mb-2">
       <TouchableOpacity
          className={`flex-1 items-center py-3 rounded-2xl ${activeTab === "roster" ? "bg-primary-500 shadow-md shadow-primary-500/20" : ""}`}
          onPress={() => setActiveTab("roster")}
       >
          <Text className={`text-sm font-black uppercase tracking-wider ${activeTab === "roster" ? "text-white" : "text-txt-muted"}`}>Roster</Text>
  </TouchableOpacity>
       <TouchableOpacity
          className={`flex-1 items-center py-3 rounded-2xl ${activeTab === "schedule" ? "bg-primary-500 shadow-md shadow-primary-500/20" : ""}`}
          onPress={() => setActiveTab("schedule")}
       >
          <Text className={`text-sm font-black uppercase tracking-wider ${activeTab === "schedule" ? "text-white" : "text-txt-muted"}`}>Schedule</Text>
  </TouchableOpacity>
   </View>

      <FlatList
        className="flex-1"
        contentContainerClassName="px-5 py-4"
        data={(activeTab === "roster" ? team.roster ?? [] : events) as any[]}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#388BFD" />
        }
        renderItem={({ item }) => {
          if (activeTab === "roster") {
            const member = item as TeamMember;
            return (
              <View className="flex-row items-center bg-surface rounded-2xl p-4 mb-3 border border-surface-border/20">
                <Avatar name={member.firstName + ' ' + member.lastName} uri={member.avatarUrl} size="md" className="mr-4" />
                <View className="flex-1">
                   <Text className="text-txt-primary font-black text-base">{member.firstName + ' ' + member.lastName}</Text>
                   <View className="flex-row items-center gap-2 mt-0.5">
                      <View className="bg-primary-500/10 px-2 py-0.5 rounded-md border border-primary-500/20">
                        <Text className="text-primary-300 text-[10px] font-black uppercase tracking-widest">{member.role}</Text>
                  </View>
               </View>
            </View>
                  {member.jerseyNumber && (
                     <View className="w-10 h-10 bg-surface-overlay rounded-xl items-center justify-center">
                       <Text className="text-txt-primary font-black">{member.jerseyNumber}</Text>
                 </View>
                  )}
           </View>
            );
          } else {
            const ev = item as Event;
            return (
<TouchableOpacity
                className="bg-surface rounded-2xl p-4 mb-3 border border-surface-border/20"
                onPress={() => router.push(`/events/${ev.id}`)}
              >
                <View className="flex-row justify-between items-center mb-2">
                   <Badge label={ev.startDate ? format(parseISO(ev.startDate), "MMM d") : "TBD"} variant="ghost" />
                   <Text className="text-txt-secondary text-[10px] font-black uppercase tracking-widest">
                     {ev.startDate ? format(parseISO(ev.startDate), "h:mm a") : ""}
                 </Text>
              </View>
                <Text className="text-txt-primary font-black text-lg mb-1">vs {ev.opponentName || "TBD"}</Text>
                <Text className="text-txt-secondary text-xs font-semi mb-3">{ev.title}</Text>

                {ev.score && (
                  <View className="bg-surface-raised rounded-xl p-3 flex-row justify-between items-center">
                    <Text className="text-txt-primary font-black">{team.name}</Text>
                    <View className="flex-row items-center gap-2">
                       <Text className="text-txt-primary font-black text-xl">{ev.score.homeScore}</Text>
                       <Text className="text-txt-muted">—</Text>
                       <Text className="text-txt-primary font-black text-xl">{ev.score.awayScore}</Text>
                </View>
                    <Text className="text-txt-secondary font-bold">{ev.opponentName || "Opp"}</Text>
            </View>
                )}
          </TouchableOpacity>
            );
          }
        }}
      />
 </SafeAreaView>
  );
}
