import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionLabel, IconChip } from "@/components/ui/Page";
import { createAnnouncement } from "@/services/announcements";
import { fetchTeams } from "@/services/topscore";
import { AnnouncementTargetType, AnnouncementType, Team } from "@/types";

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;

type ExpirationOption = {
  label: string;
  hours: number | null;
  description: string;
};

const EXPIRATION_OPTIONS: ExpirationOption[] = [
  { label: "1 Hour", hours: 1, description: "Quick updates" },
  { label: "24 Hours", hours: 24, description: "Single day" },
  { label: "3 Days", hours: 72, description: "Short term" },
  { label: "7 Days", hours: 168, description: "One week" },
  { label: "30 Days", hours: 720, description: "Long term" },
  { label: "Never", hours: null, description: "No expiry" },
];

const ANNOUNCEMENT_TYPE_OPTIONS: { type: AnnouncementType; label: string; description: string; icon: keyof typeof Ionicons.glyphMap; accent: string }[] = [
  { type: "league_longterm", label: "League Update", description: "Long-term league announcements", icon: "trophy", accent: "#1BA1E2" },
  { type: "game", label: "Game Alert", description: "Game-specific updates", icon: "flash", accent: "#F09609" },
  { type: "pada_org", label: "PADA Org", description: "Organization-wide announcements", icon: "business", accent: "#A200FF" },
];

const TARGET_OPTIONS: { type: AnnouncementTargetType; label: string; description: string; requiresLeagueAdmin: boolean }[] = [
  { type: "team", label: "Team Only", description: "Your team members", requiresLeagueAdmin: false },
  { type: "division", label: "Division", description: "All teams in a division", requiresLeagueAdmin: true },
  { type: "league", label: "League-wide", description: "All teams in a league", requiresLeagueAdmin: true },
];

const PADA_GLOBAL_TARGET_ID = "pada-global";

export default function CreateAnnouncementScreen() {
  useAuthRedirect();
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>("league_longterm");
  const [targetType, setTargetType] = useState<AnnouncementTargetType>("team");
  const [targetId, setTargetId] = useState("");
  const [expirationHours, setExpirationHours] = useState<number | null>(168);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [divisionTargets, setDivisionTargets] = useState<{ id: string; name: string }[]>([]);
  const [leagueTargets, setLeagueTargets] = useState<{ id: string; name: string }[]>([]);

  const isLeagueAdmin = user?.isCoordinator || user?.isAdmin;
  const isCaptain = user?.role === "captain";
  const canPost = isLeagueAdmin || isCaptain;

  useEffect(() => {
    if (canPost) loadTeams();
  }, [canPost]);

  useEffect(() => {
    if (targetType === "team" && teams.length > 0 && !teams.some((t) => t.id === targetId)) setTargetId(teams[0].id);
    if (targetType === "division" && divisionTargets.length > 0 && !divisionTargets.some((d) => d.id === targetId)) setTargetId(divisionTargets[0].id);
    if (targetType === "league") {
      if (targetId !== PADA_GLOBAL_TARGET_ID && leagueTargets.length > 0 && !leagueTargets.some((l) => l.id === targetId)) {
        setTargetId(leagueTargets[0].id);
      } else if (!targetId) setTargetId(PADA_GLOBAL_TARGET_ID);
    }
  }, [targetType, teams, divisionTargets, leagueTargets, targetId]);

  useEffect(() => {
    if (!isLeagueAdmin && targetType !== "team") setTargetType("team");
  }, [isLeagueAdmin, targetType]);

  const loadTeams = async () => {
    try {
      const result = await fetchTeams();
      const data = result.data;
      setTeams(data);
      if (data.length > 0 && !targetId && targetType === "team") setTargetId(data[0].id);
      const divs = new Map<string, { id: string; name: string }>();
      for (const t of data) {
        if (t.division && !divs.has(t.division)) divs.set(t.division, { id: t.division, name: t.division });
      }
      setDivisionTargets(Array.from(divs.values()));
      const leagues = new Map<string, { id: string; name: string }>();
      for (const t of data) {
        const lid = (t as Team & { leagueId?: string }).leagueId;
        if (lid && !leagues.has(lid)) leagues.set(lid, { id: lid, name: lid });
      }
      const leagueList = Array.from(leagues.values());
      setLeagueTargets(leagueList);
      if (isLeagueAdmin && targetType === "league" && !targetId && targetId !== PADA_GLOBAL_TARGET_ID && leagueList.length > 0) {
        setTargetId(leagueList[0].id);
      }
    } catch (err) {
      console.error("Error loading teams:", err);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const calculateExpiresAt = (hours: number | null): string | undefined => {
    if (hours === null) return undefined;
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  };

  const selectedTeam = useMemo(() => (targetType === "team" ? teams.find((t) => t.id === targetId) : undefined), [teams, targetId, targetType]);

  const getAvailableTargetOptions = () => (isLeagueAdmin ? TARGET_OPTIONS : TARGET_OPTIONS.filter((opt) => !opt.requiresLeagueAdmin));

  const validateForm = (): string | null => {
    if (!title.trim()) return "Please enter a title";
    if (!content.trim()) return "Please enter a message";
    if (title.length > TITLE_MAX_LENGTH) return `Title must be ${TITLE_MAX_LENGTH} characters or fewer (currently ${title.length}).`;
    if (content.length > CONTENT_MAX_LENGTH) return `Message must be ${CONTENT_MAX_LENGTH} characters or fewer (currently ${content.length}).`;
    if (targetType === "team" && !targetId) return "Please select a team";
    if (targetType === "league" && isLeagueAdmin) {
      if (!targetId) {
        if (leagueTargets.length === 0) return null;
        return "Please select a league";
      }
      const profile = leagueTargets.find((l) => l.id === targetId);
      if (!profile && targetId !== PADA_GLOBAL_TARGET_ID) return "Selected league is invalid";
    }
    if (targetType === "division" && isLeagueAdmin) {
      if (!targetId) return "Please select a division";
      const profile = divisionTargets.find((d) => d.id === targetId);
      if (!profile) return "Selected division is invalid";
    }
    if (announcementType === "pada_org" && !isLeagueAdmin) return "Only league admins can create PADA organization announcements";
    return null;
  };

  const handlePost = async () => {
    const error = validateForm();
    if (error) { Alert.alert("Validation Error", error); return; }
    Alert.alert("Post Announcement", "Are you sure you want to post this announcement?", [
      { text: "Cancel", style: "cancel" },
      { text: "Post", onPress: async () => { await submitAnnouncement(); } },
    ]);
  };

  const submitAnnouncement = async () => {
    if (!user) { Alert.alert("Error", "You must be logged in to post announcements"); return; }
    setIsSubmitting(true);
    const finalTargetId = targetType === "league" ? (targetId || PADA_GLOBAL_TARGET_ID) : targetId;
    const success = await createAnnouncement({
      authorId: user.id,
      authorName: `${user.firstName} ${user.lastName}`,
      authorRole: isLeagueAdmin ? "league_admin" : "team_captain",
      targetType,
      targetId: finalTargetId,
      title: title.trim(),
      content: content.trim(),
      isUrgent,
      announcementType,
      expiresAt: calculateExpiresAt(expirationHours),
    });
    setIsSubmitting(false);
    if (success) Alert.alert("Success", "Announcement posted!", [{ text: "OK", onPress: () => router.back() }]);
    else Alert.alert("Error", "Failed to post announcement. Please try again.");
  };

  const titleCharCount = title.length;
  const contentCharCount = content.length;
  const isTitleOverLimit = titleCharCount > TITLE_MAX_LENGTH;
  const isContentOverLimit = contentCharCount > CONTENT_MAX_LENGTH;
  const canSubmit = !isTitleOverLimit && !isContentOverLimit && title.trim() && content.trim() && (targetType !== "team" || targetId);

  if (!canPost) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6">
        <Ionicons name="lock-closed" size={48} color="#E51400" />
        <Text className="text-txt-primary text-xl font-bold uppercase tracking-wider mt-4 text-center">Permission Required</Text>
        <Text className="text-txt-muted text-center mt-2">
          Only team captains and league admins can create announcements.
        </Text>
        <Button label="Go Back" variant="outline" onPress={() => router.back()} className="mt-6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <PageHeader
          title="new announcement"
          subtitle="post to your audience"
          back={() => router.back()}
          right={
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => setShowPreview((p) => !p)} disabled={isSubmitting} className="w-10 h-10 items-center justify-center bg-surface border-2 border-surface-border">
                <Ionicons name={showPreview ? "eye-off" : "eye"} size={20} color="#000000" />
              </TouchableOpacity>
              {isSubmitting ? (
                <ActivityIndicator color="#00ABA9" />
              ) : (
                <Button
                  label="Post"
                  size="sm"
                  variant={canSubmit ? "primary" : "secondary"}
                  onPress={handlePost}
                  disabled={!canSubmit}
                />
              )}
            </View>
          }
        />

        <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
          {showPreview && (
            <View className="bg-primary border-2 border-primary-700 p-4 mb-6">
              <Text className="text-txt-inverse text-[10px] font-bold uppercase tracking-wider">Preview</Text>
              <Text className="text-txt-inverse text-3xl font-light lowercase tracking-tight mt-1">
                {title || "Untitled"}
              </Text>
              <Text className="text-txt-inverse/85 text-sm mt-2">
                {content || "No content"}
              </Text>
              <View className="flex-row items-center gap-4 mt-3">
                <Text className="text-txt-inverse/85 text-[11px] font-bold uppercase tracking-wider">
                  {targetType === "team" && selectedTeam ? selectedTeam.name : targetType === "division" ? "Division-wide" : "League-wide"}
                </Text>
                <Text className="text-txt-inverse/85 text-[11px] font-bold uppercase tracking-wider">
                  {expirationHours === null ? "Never expires" : `Expires in ${expirationHours}h`}
                </Text>
              </View>
            </View>
          )}

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-wider">Title</Text>
              <Text className={`text-[10px] font-bold uppercase tracking-wider ${isTitleOverLimit ? "text-danger" : "text-txt-muted"}`}>
                {titleCharCount}/{TITLE_MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              className={`bg-surface-raised border-2 text-txt-primary text-sm px-4 py-3 ${isTitleOverLimit ? "border-danger" : "border-surface-border"}`}
              placeholder="Enter announcement title..."
              placeholderTextColor="#8A8A8A"
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
              maxLength={TITLE_MAX_LENGTH + 20}
            />
          </View>

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-wider">Message</Text>
              <Text className={`text-[10px] font-bold uppercase tracking-wider ${isContentOverLimit ? "text-danger" : "text-txt-muted"}`}>
                {contentCharCount}/{CONTENT_MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              className={`bg-surface-raised border-2 text-txt-primary text-sm px-4 py-3 min-h-[150px] ${isContentOverLimit ? "border-danger" : "border-surface-border"}`}
              placeholder="Write your announcement message..."
              placeholderTextColor="#8A8A8A"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              editable={!isSubmitting}
              maxLength={CONTENT_MAX_LENGTH + 100}
            />
          </View>

          <SectionLabel>announcement type</SectionLabel>
          <View className="gap-3 mb-6">
            {ANNOUNCEMENT_TYPE_OPTIONS.map((option) => {
              const isDisabled = option.type === "pada_org" && !isLeagueAdmin;
              const isSelected = announcementType === option.type;
              return (
                <TouchableOpacity
                  key={option.type}
                  className={`flex-row items-center p-4 border-2 ${isSelected ? `bg-[${option.accent}]/10` : "bg-surface-raised border-surface-border"} ${isDisabled ? "opacity-50" : ""}`}
                  style={isSelected ? { backgroundColor: `${option.accent}1A`, borderColor: option.accent } : undefined}
                  onPress={() => !isDisabled && setAnnouncementType(option.type)}
                  disabled={isSubmitting || isDisabled}
                  activeOpacity={0.85}
                >
                  <IconChip name={option.icon} color={option.accent} background={`${option.accent}22`} />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-bold" style={isSelected ? { color: option.accent } : undefined}>
                        {option.label}
                      </Text>
                      {isDisabled && (
                        <View className="bg-surface-overlay border-2 border-surface-border px-2 py-0.5">
                          <Text className="text-txt-muted text-[10px] uppercase font-bold tracking-wider">Admin only</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-txt-muted text-xs mt-1">{option.description}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={option.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <SectionLabel>audience</SectionLabel>
          <View className="gap-3 mb-6">
            {getAvailableTargetOptions().map((option) => {
              const isSelected = targetType === option.type;
              return (
                <TouchableOpacity
                  key={option.type}
                  className={`flex-row items-center p-4 border-2 ${isSelected ? "bg-primary-50 border-primary" : "bg-surface-raised border-surface-border"}`}
                  onPress={() => setTargetType(option.type)}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  <View className="flex-1">
                    <Text className={`text-sm font-bold ${isSelected ? "text-primary" : "text-txt-primary"}`}>
                      {option.label}
                    </Text>
                    <Text className="text-txt-muted text-xs mt-1">{option.description}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#00ABA9" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {targetType === "team" && (
            <View className="mb-6">
              <SectionLabel>select team</SectionLabel>
              {isLoadingTeams ? (
                <View className="items-center py-6"><ActivityIndicator color="#00ABA9" /></View>
              ) : teams.length === 0 ? (
                <View className="bg-surface border-2 border-surface-border p-6 items-center">
                  <Ionicons name="people-outline" size={32} color="#8A8A8A" />
                  <Text className="text-txt-muted text-sm mt-2">No teams available</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {teams.map((team) => {
                      const isSelected = targetId === team.id;
                      return (
                        <TouchableOpacity
                          key={team.id}
                          className={`px-4 py-3 border-2 ${isSelected ? "bg-primary border-primary" : "bg-surface-raised border-surface-border"}`}
                          onPress={() => setTargetId(team.id)}
                          disabled={isSubmitting}
                          activeOpacity={0.85}
                        >
                          <Text className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-txt-inverse" : "text-txt-secondary"}`}>
                            {team.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          <SectionLabel>expiration</SectionLabel>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {EXPIRATION_OPTIONS.map((option) => {
              const isSelected = expirationHours === option.hours;
              return (
                <TouchableOpacity
                  key={option.label}
                  className={`flex-1 min-w-[100px] p-3 border-2 items-center ${isSelected ? "bg-primary border-primary" : "bg-surface-raised border-surface-border"}`}
                  onPress={() => setExpirationHours(option.hours)}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  <Text className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-txt-inverse" : "text-txt-primary"}`}>
                    {option.label}
                  </Text>
                  <Text className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isSelected ? "text-txt-inverse/80" : "text-txt-muted"}`}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className={`p-4 mb-8 border-2 ${isUrgent ? "bg-danger/10 border-danger" : "bg-surface border-surface-border"}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="warning" size={18} color={isUrgent ? "#E51400" : "#5C5C5C"} />
                  <Text className={`text-sm font-bold ${isUrgent ? "text-danger" : "text-txt-primary"}`}>
                    Mark as Urgent
                  </Text>
                </View>
                <Text className="text-txt-muted text-xs mt-1">
                  Send immediate push notification. Use only for cancellations or emergencies.
                </Text>
              </View>
              <Switch
                value={isUrgent}
                onValueChange={setIsUrgent}
                trackColor={{ false: "#D8D8D8", true: "#E51400" }}
                thumbColor="#FFFFFF"
                disabled={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}