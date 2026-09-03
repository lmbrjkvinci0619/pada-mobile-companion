import React, { useState, useMemo } from "react";
import { View, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTeam, useEvents } from "@/hooks/useApi";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useColors } from "@/lib/tokens";
import type { TeamMember, Event } from "@/types";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { PageHeader } from "@/components/ui/Page";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Pivot, PivotContent } from "@/components/ui/Pivot";
import { TeamName, Score, Title, Eyebrow, EyebrowTight, Body } from "@/components/ui";
import { format, parseISO } from "date-fns";
import { RefreshControl } from "react-native";

type TeamTab = "roster" | "schedule";

export default function TeamDetailScreen() {
  useAuthRedirect();
  const colors = useColors();
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

      <View className="px-5 pt-4 pb-5 border-b border-primary" style={{ backgroundColor: colors.primary }}>
        <TeamName style={{ color: colors.txtInverse }} size="md">
          {team.name.toLowerCase()}
        </TeamName>
        <View className="flex-row items-center justify-between mt-1">
          <Eyebrow style={{ color: colors.txtInverse }}>{team.division}</Eyebrow>
          {recordText && (
            <View className="px-3 py-1" style={{ backgroundColor: colors.surfaceRaised }}>
              <EyebrowTight style={{ color: colors.primary }}>{recordText}</EyebrowTight>
            </View>
          )}
        </View>
      </View>

      <ReadOnlyBanner />

      {nextEvent && (
        <TouchableOpacity
          className="mx-5 mb-3 p-4 flex-row items-center gap-4"
          style={{ backgroundColor: colors.danger }}
          onPress={() => router.push(`/events/${nextEvent.id}`)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${nextEvent.status === "in_progress" ? "live now" : "next match"} vs ${nextEvent.opponentName || "TBD"}`}
        >
          <View className="w-12 h-12 items-center justify-center" style={{ backgroundColor: colors.surfaceRaised }}>
            <Ionicons name="flash" size={24} color={colors.danger} />
          </View>
          <View className="flex-1">
            <Eyebrow style={{ color: colors.txtInverse }} className="text-[10px] tracking-[0.2em]">
              {nextEvent.status === "in_progress" ? "live now" : "next match"}
            </Eyebrow>
            <Body style={{ color: colors.txtInverse }} className="text-base font-semibold mt-0.5" numberOfLines={1}>
              vs {nextEvent.opponentName || "TBD"}
            </Body>
            {nextEvent.score && (
              <Body style={{ color: colors.txtInverse }} className="text-xs font-semibold mt-0.5">
                live: {nextEvent.score.homeScore} – {nextEvent.score.awayScore}
              </Body>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.txtInverse} />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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
                        accent={colors.primary}
                      />
                    }
                    title={`${member.firstName} ${member.lastName}`}
                    subtitle={member.role}
                    right={
                      member.jerseyNumber != null ? (
                        <View
                          className="w-11 h-11 items-center justify-center border border-surface-border"
                          style={{ backgroundColor: colors.surfaceOverlay }}
                        >
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
                      <View
                        className="border border-surface-border p-3 flex-row justify-between items-center"
                        style={{ backgroundColor: colors.surfaceOverlay }}
                      >
                        <Body tone="primary" className="font-semibold text-sm" numberOfLines={1}>
                          {ev.score.homeTeamName || "Home"}
                        </Body>
                        <View className="flex-row items-center gap-3">
                          <Score tone="primary" size="sm">{ev.score.homeScore}</Score>
                          <Body tone="muted">—</Body>
                          <Score tone="primary" size="sm">{ev.score.awayScore}</Score>
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