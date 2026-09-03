import React, { useState, useMemo } from "react";
import { View, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTeam, useEvents } from "@/hooks/useApi";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import type { TeamMember, Event } from "@/types";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader } from "@/components/ui/Page";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Pivot, PivotContent } from "@/components/ui/Pivot";
import { Title, Eyebrow, EyebrowTight, Body } from "@/components/ui";
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
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <PageHeader title="team" back={() => router.back()} />
        <LoaderBar visible />
      </SafeAreaView>
    );
  }

  if (!team) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Body tone="muted">Team not found</Body>
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

      <View className="px-5 pt-4 pb-5 bg-primary border-b border-primary">
        <Title tone="inverse" size="md">
          {team.name.toLowerCase()}
        </Title>
        <View className="flex-row items-center justify-between mt-1">
          <Eyebrow tone="inverse">{team.division}</Eyebrow>
          {recordText && (
            <View className="bg-white px-3 py-1">
              <EyebrowTight tone="primary">{recordText}</EyebrowTight>
            </View>
          )}
        </View>
      </View>

      <ReadOnlyBanner />

      {nextEvent && (
        <TouchableOpacity
          className="mx-5 mb-3 bg-danger p-4 flex-row items-center gap-4"
          onPress={() => router.push(`/events/${nextEvent.id}`)}
          activeOpacity={0.85}
        >
          <View className="w-12 h-12 bg-white items-center justify-center">
            <Ionicons name="flash" size={24} color="#E51400" />
          </View>
          <View className="flex-1">
            <Eyebrow tone="inverse" className="text-[10px] tracking-[0.2em]">
              {nextEvent.status === "in_progress" ? "live now" : "next match"}
            </Eyebrow>
            <Body tone="inverse" className="text-base font-semibold mt-0.5" numberOfLines={1}>
              vs {nextEvent.opponentName || "TBD"}
            </Body>
            {nextEvent.score && (
              <Body tone="inverse" className="text-xs font-semibold mt-0.5">
                live: {nextEvent.score.homeScore} – {nextEvent.score.awayScore}
              </Body>
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
                <Card variant="raised" className="mb-3">
                  <ListRow
                    icon={
                      <Avatar
                        name={`${member.firstName} ${member.lastName}`}
                        uri={member.avatarUrl}
                        size="md"
                        accent="#00ABA9"
                      />
                    }
                    title={`${member.firstName} ${member.lastName}`}
                    subtitle={member.role}
                    right={
                      member.jerseyNumber != null ? (
                        <View className="w-10 h-10 bg-surface-overlay items-center justify-center border border-surface-border">
                          <Body tone="primary" className="font-semibold">{member.jerseyNumber}</Body>
                        </View>
                      ) : undefined
                    }
                  />
                </Card>
              );
            }
            const ev = item as Event;
            return (
              <TouchableOpacity
                className="mb-3"
                onPress={() => router.push(`/events/${ev.id}`)}
                activeOpacity={0.85}
              >
                <Card variant="raised">
                  <View className="p-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Badge label={ev.startDate ? format(parseISO(ev.startDate), "MMM d") : "TBD"} variant="ghost" />
                      <EyebrowTight tone="secondary">
                        {ev.startDate ? format(parseISO(ev.startDate), "h:mm a") : ""}
                      </EyebrowTight>
                    </View>
                    <Body tone="primary" className="font-semibold text-base mb-1">
                      vs {ev.opponentName || "TBD"}
                    </Body>
                    <Body tone="secondary" className="text-sm mb-3">
                      {ev.title}
                    </Body>

                    {ev.score && (
                      <View className="bg-surface-overlay border border-surface-border p-3 flex-row justify-between items-center">
                        <Body tone="primary" className="font-semibold text-sm" numberOfLines={1}>
                          {ev.score.homeTeamName || "Home"}
                        </Body>
                        <View className="flex-row items-center gap-3">
                          <Title tone="primary" size="sm">{ev.score.homeScore}</Title>
                          <Body tone="muted">—</Body>
                          <Title tone="primary" size="sm">{ev.score.awayScore}</Title>
                        </View>
                        <Body tone="secondary" className="text-xs font-semibold" numberOfLines={1}>
                          {ev.score.awayTeamName || "Away"}
                        </Body>
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      </PivotContent>
    </SafeAreaView>
  );
}