import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useEvent, useTeam } from "@/hooks/useApi";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { reportScore, updateScore, fetchGames, canUserReportTeamScores } from "@/services/topscore";
import { invalidateCache } from "@/lib/apiClient";
import { invalidateQueries } from "@/lib/queryClient";
import type { EventStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader, SectionLabel } from "@/components/ui/Page";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Hero, EyebrowTight, Body, Label } from "@/components/ui";

function ScoreAdjuster({
  teamName,
  score,
  onChange,
}: {
  teamName: string;
  score: number;
  onChange: (s: number) => void;
}) {
  return (
    <Card variant="raised" className="p-5 items-center flex-1">
      <EyebrowTight tone="secondary" className="text-center h-10" numberOfLines={2}>
        {teamName}
      </EyebrowTight>
      <Hero tone="primary" size="2xl" className="my-4">{score}</Hero>
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="w-12 h-12 bg-surface-overlay border border-surface-border items-center justify-center"
          onPress={() => onChange(Math.max(0, score - 1))}
          accessibilityRole="button"
          accessibilityLabel={`decrease ${teamName} score`}
          activeOpacity={0.85}
        >
          <Ionicons name="remove" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-12 h-12 bg-primary items-center justify-center"
          onPress={() => onChange(score + 1)}
          accessibilityRole="button"
          accessibilityLabel={`increase ${teamName} score`}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function ReportScoreScreen() {
  useAuthRedirect();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: eventData } = useEvent(id);
  const event = eventData ?? null;
  const eventTeamId = event?.teamId;
  const { data: team } = useTeam(eventTeamId ?? "");

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [status, setStatus] = useState<EventStatus>("in_progress");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);

  useEffect(() => {
    if (!event) return;
    if (event.score) {
      setHomeScore(event.score.homeScore);
      setAwayScore(event.score.awayScore);
    }
    if (event.status === "completed" || event.status === "cancelled") setStatus(event.status);
    else if (event.status === "scheduled") setStatus("in_progress");
  }, [event]);

  useEffect(() => {
    async function loadGame() {
      if (!id) return;
      setIsLoadingGame(true);
      try {
        const games = await fetchGames({ eventId: id, perPage: 1 });
        if (games.data.length > 0) setGameId(games.data[0].id);
      } catch (err) {
        console.error("Failed to fetch game for score reporting:", err);
      } finally {
        setIsLoadingGame(false);
      }
    }
    loadGame();
  }, [id]);

  const isAuthorized = canUserReportTeamScores(team, user);

  const handleSubmit = async () => {
    if (!event || !gameId) return;
    if (!isAuthorized) {
      Alert.alert("Permission Required", "Only team captains (for this specific team) may report scores.");
      return;
    }
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || homeScore < 0 || awayScore < 0) {
      Alert.alert("Invalid Score", "Scores must be non-negative numbers.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = event.score
        ? await updateScore(gameId, homeScore, awayScore, false, status)
        : await reportScore(gameId, homeScore, awayScore, false, status);
      if (result?.success !== false) {
        invalidateCache(`/api/events/${event.id}`);
        invalidateCache(`/api/games?event_id=${event.id}`);
        invalidateQueries(["events", "id", event.id]);
        invalidateQueries(["events", "all"]);
        Alert.alert("Score Submitted", "The score has been reported.", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        Alert.alert("Submission Failed", "We couldn't submit the score. Please try again.");
      }
    } catch (err) {
      console.error("Failed to report score:", err);
      Alert.alert("Submission Failed", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return null;

  if (isLoadingGame) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <PageHeader title="report score" back={() => router.back()} />
        <LoaderBar visible />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="football-outline" size={48} color="#8A8A8A" />
          <Body tone="muted" className="mt-3 text-center">
            loading game data
          </Body>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameId) {
    return (
      <SafeAreaView className="flex-1 bg-bg justify-center items-center p-6">
        <Ionicons name="warning-outline" size={64} color="#5C5C5C" />
        <Label tone="primary" className="text-xl mt-4 text-center">
          no game found
        </Label>
        <Body tone="muted" className="mt-2 text-center">
          This event does not have a game to report scores for.
        </Body>
        <Button label="Go Back" variant="primary" className="mt-6" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (!isAuthorized) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6" edges={["top", "bottom"]}>
        <Ionicons name="lock-closed" size={48} color="#E51400" />
        <Label tone="primary" className="text-xl mt-4 text-center">
          permission required
        </Label>
        <Body tone="muted" className="text-center mt-2">
          Only the captain of this specific team (and authorized event coordinators or score reporters) may report scores.
        </Body>
        <Button label="Go Back" variant="outline" onPress={() => router.back()} className="mt-6" />
      </SafeAreaView>
    );
  }

  const homeTeamName = event.teamName || "Home";
  const awayTeamName = event.opponentName || "Away";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <PageHeader
        title="report score"
        subtitle={event.title}
        back={() => router.back()}
        right={
          isSubmitting ? (
            <EyebrowTight tone="primaryAccent">saving…</EyebrowTight>
          ) : (
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
              <EyebrowTight tone="primaryAccent">save</EyebrowTight>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-4 mb-8">
          <ScoreAdjuster teamName={homeTeamName} score={homeScore} onChange={setHomeScore} />
          <ScoreAdjuster teamName={awayTeamName} score={awayScore} onChange={setAwayScore} />
        </View>

        <SectionLabel>game status</SectionLabel>
        <Card variant="default" className="mb-8">
          <StatusOption label="In Progress" selected={status === "in_progress"} onPress={() => setStatus("in_progress")} />
          <StatusOption label="Completed (Final)" selected={status === "completed"} onPress={() => setStatus("completed")} />
          <StatusOption label="Cancelled" selected={status === "cancelled"} onPress={() => setStatus("cancelled")} last />
        </Card>

        <Button
          label={isSubmitting ? "Submitting..." : "Submit Score"}
          variant="success"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusOption({
  label,
  selected,
  onPress,
  last,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      className={`px-5 py-4 flex-row items-center justify-between ${last ? "" : "border-b border-surface-border"} ${selected ? "bg-primary-50" : ""}`}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      activeOpacity={0.85}
    >
      <Label tone={selected ? "primaryAccent" : "primary"}>{label}</Label>
      {selected && <Ionicons name="checkmark" size={20} color="#00ABA9" />}
    </TouchableOpacity>
  );
}