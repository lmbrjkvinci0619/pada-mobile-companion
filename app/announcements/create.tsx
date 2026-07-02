import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Button } from "@/components/ui/Button";
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

const ANNOUNCEMENT_TYPE_OPTIONS: { type: AnnouncementType; label: string; description: string; icon: string }[] = [
  { type: "league_longterm", label: "League Update", description: "Long-term league announcements", icon: "trophy" },
  { type: "game", label: "Game Alert", description: "Game-specific updates", icon: "flash" },
  { type: "pada_org", label: "PADA Org", description: "Organization-wide announcements", icon: "business" },
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
    if (canPost) {
      loadTeams();
    }
  }, [canPost]);

  useEffect(() => {
    if (targetType === "team" && teams.length > 0 && !teams.some(t => t.id === targetId)) {
      setTargetId(teams[0].id);
    }
    if (targetType === "division" && divisionTargets.length > 0 && !divisionTargets.some(d => d.id === targetId)) {
      setTargetId(divisionTargets[0].id);
    }
    if (targetType === "league") {
      if (
        targetId !== PADA_GLOBAL_TARGET_ID &&
        leagueTargets.length > 0 &&
        !leagueTargets.some(l => l.id === targetId)
      ) {
        setTargetId(leagueTargets[0].id);
      } else if (!targetId) {
        setTargetId(PADA_GLOBAL_TARGET_ID);
      }
    }
  }, [targetType, teams, divisionTargets, leagueTargets, targetId]);

  useEffect(() => {
    if (!isLeagueAdmin && targetType !== "team") {
      setTargetType("team");
    }
  }, [isLeagueAdmin, targetType]);

  const loadTeams = async () => {
    try {
      const result = await fetchTeams();
      const data = result.data;
      setTeams(data);
      if (data.length > 0 && !targetId && targetType === "team") {
        setTargetId(data[0].id);
      }
      const divs = new Map<string, { id: string; name: string }>();
      for (const t of data) {
        if (t.division && !divs.has(t.division)) {
          divs.set(t.division, { id: t.division, name: t.division });
        }
      }
      setDivisionTargets(Array.from(divs.values()));
      const leagues = new Map<string, { id: string; name: string }>();
      for (const t of data) {
        const lid = (t as Team & { leagueId?: string }).leagueId;
        if (lid && !leagues.has(lid)) {
          leagues.set(lid, { id: lid, name: lid });
        }
      }
      const leagueList = Array.from(leagues.values());
      setLeagueTargets(leagueList);
      if (
        isLeagueAdmin &&
        targetType === "league" &&
        !targetId &&
        targetId !== PADA_GLOBAL_TARGET_ID &&
        leagueList.length > 0
      ) {
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

  const selectedTeam = useMemo(() => {
    return targetType === "team" ? teams.find(t => t.id === targetId) : undefined;
  }, [teams, targetId, targetType]);

  const getAvailableTargetOptions = () => {
    if (isLeagueAdmin) {
      return TARGET_OPTIONS;
    }
    return TARGET_OPTIONS.filter(opt => !opt.requiresLeagueAdmin);
  };

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return "Please enter a title";
    }
    if (!content.trim()) {
      return "Please enter a message";
    }
    if (title.length > TITLE_MAX_LENGTH) {
      return `Title must be ${TITLE_MAX_LENGTH} characters or fewer (currently ${title.length}).`;
    }
    if (content.length > CONTENT_MAX_LENGTH) {
      return `Message must be ${CONTENT_MAX_LENGTH} characters or fewer (currently ${content.length}).`;
    }
    if (targetType === "team" && !targetId) {
      return "Please select a team";
    }
    if (targetType === "league" && isLeagueAdmin) {
      if (!targetId) {
        if (leagueTargets.length === 0) {
          return null;
        }
        return "Please select a league";
      }
      const profile = leagueTargets.find((l) => l.id === targetId);
      if (!profile && targetId !== PADA_GLOBAL_TARGET_ID) {
        return "Selected league is invalid";
      }
    }
    if (targetType === "division" && isLeagueAdmin) {
      if (!targetId) {
        return "Please select a division";
      }
      const profile = divisionTargets.find((d) => d.id === targetId);
      if (!profile) {
        return "Selected division is invalid";
      }
    }
    if (announcementType === "pada_org" && !isLeagueAdmin) {
      return "Only league admins can create PADA organization announcements";
    }
    return null;
  };

  const handlePost = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    Alert.alert(
      "Post Announcement",
      "Are you sure you want to post this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Post",
          onPress: async () => {
            await submitAnnouncement();
          },
        },
      ]
    );
  };

  const submitAnnouncement = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to post announcements");
      return;
    }

    setIsSubmitting(true);

    let finalTargetId: string;
    if (targetType === "league") {
      finalTargetId = targetId || PADA_GLOBAL_TARGET_ID;
    } else if (targetType === "division") {
      finalTargetId = targetId;
    } else {
      finalTargetId = targetId;
    }

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

    if (success) {
      Alert.alert("Success", "Announcement posted!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Error", "Failed to post announcement. Please try again.");
    }
  };

  const titleCharCount = title.length;
  const contentCharCount = content.length;
  const isTitleOverLimit = titleCharCount > TITLE_MAX_LENGTH;
  const isContentOverLimit = contentCharCount > CONTENT_MAX_LENGTH;
  const canSubmit = !isTitleOverLimit && !isContentOverLimit && title.trim() && content.trim() && (targetType !== "team" || targetId);

  if (!canPost) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-6">
        <Ionicons name="lock-closed" size={48} color="#E53935" />
        <Text className="text-txt-primary text-xl font-bold mt-4 text-center">Permission Required</Text>
        <Text className="text-txt-muted text-center mt-2">
          Only team captains and league admins can create announcements.
        </Text>
        <Button
          label="Go Back"
          variant="outline"
          onPress={() => router.back()}
          className="mt-6"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
              <Ionicons name="close" size={24} color="#E6EDF3" />
            </TouchableOpacity>
            <Text className="text-txt-primary text-xl font-bold">New Announcement</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setShowPreview(!showPreview)}
              className="p-2"
              disabled={isSubmitting}
            >
              <Ionicons
                name={showPreview ? "eye-off" : "eye"}
                size={22}
                color={showPreview ? "#1E88E5" : "#8B949E"}
              />
            </TouchableOpacity>
            {isSubmitting ? (
              <ActivityIndicator color="#1E88E5" />
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
        </View>

        <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
          {showPreview ? (
            <View className="bg-surface-raised rounded-2xl p-4 mb-6 border border-primary-500/30">
              <View className="flex-row items-center gap-2 mb-3">
                <View className={`px-2 py-1 rounded-md ${
                  announcementType === "pada_org" ? "bg-purple-600" :
                  announcementType === "game" ? "bg-orange-500" : "bg-blue-500"
                }`}>
                  <Text className="text-white text-xs font-bold uppercase">
                    {ANNOUNCEMENT_TYPE_OPTIONS.find(o => o.type === announcementType)?.label}
                  </Text>
                </View>
                {isUrgent && (
                  <View className="px-2 py-1 rounded-md bg-danger">
                    <Text className="text-white text-xs font-bold">URGENT</Text>
                  </View>
                )}
              </View>
              <Text className="text-txt-primary text-lg font-bold mb-2">{title || "Untitled"}</Text>
              <Text className="text-txt-secondary text-sm mb-3">{content || "No content"}</Text>
              <View className="flex-row items-center gap-4 text-xs text-txt-muted">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="people" size={12} />
                  <Text>
                    {targetType === "team" && selectedTeam ? selectedTeam.name :
                     targetType === "division" ? "Division-wide" :
                     "League-wide"}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={12} />
                  <Text>
                    {expirationHours === null ? "Never expires" :
                     `Expires in ${expirationHours}h`}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-txt-secondary text-sm font-bold uppercase">Title</Text>
              <Text className={`text-xs ${isTitleOverLimit ? "text-danger" : "text-txt-muted"}`}>
                {titleCharCount}/{TITLE_MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              className={`bg-surface-raised border text-txt-primary text-base px-4 py-3 rounded-xl ${
                isTitleOverLimit ? "border-danger" : "border-surface-overlay"
              }`}
              placeholder="Enter announcement title..."
              placeholderTextColor="#8B949E"
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
              maxLength={TITLE_MAX_LENGTH + 20}
            />
            {isTitleOverLimit && (
              <Text className="text-danger text-xs mt-1">Title exceeds maximum length</Text>
            )}
          </View>

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-txt-secondary text-sm font-bold uppercase">Message</Text>
              <Text className={`text-xs ${isContentOverLimit ? "text-danger" : "text-txt-muted"}`}>
                {contentCharCount}/{CONTENT_MAX_LENGTH}
              </Text>
            </View>
            <TextInput
              className={`bg-surface-raised border text-txt-primary text-base px-4 py-3 rounded-xl min-h-[150px] ${
                isContentOverLimit ? "border-danger" : "border-surface-overlay"
              }`}
              placeholder="Write your announcement message..."
              placeholderTextColor="#8B949E"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              editable={!isSubmitting}
              maxLength={CONTENT_MAX_LENGTH + 100}
            />
            {isContentOverLimit && (
              <Text className="text-danger text-xs mt-1">Content exceeds maximum length</Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-txt-secondary text-sm font-bold uppercase mb-3">Announcement Type</Text>
            <View className="gap-3">
              {ANNOUNCEMENT_TYPE_OPTIONS.map(option => {
                const isDisabled = option.type === "pada_org" && !isLeagueAdmin;
                const isSelected = announcementType === option.type;
                return (
                  <TouchableOpacity
                    key={option.type}
                    className={`flex-row items-center p-4 rounded-xl border ${
                      isSelected ? "bg-primary-500/10 border-primary-500" : "bg-surface-raised border-surface-overlay"
                    } ${isDisabled ? "opacity-50" : ""}`}
                    onPress={() => !isDisabled && setAnnouncementType(option.type)}
                    disabled={isSubmitting || isDisabled}
                  >
                    <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                      isSelected ? "bg-primary-500" : "bg-surface-overlay"
                    }`}>
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={isSelected ? "#fff" : "#8B949E"}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className={`font-semi ${isSelected ? "text-primary-400" : "text-txt-primary"}`}>
                          {option.label}
                        </Text>
                        {isDisabled && (
                          <View className="bg-surface-overlay px-2 py-0.5 rounded">
                            <Text className="text-txt-muted text-xs">Admin only</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-txt-muted text-xs mt-1">{option.description}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#1E88E5" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-txt-secondary text-sm font-bold uppercase mb-3">Audience</Text>
            <View className="gap-3">
              {getAvailableTargetOptions().map(option => {
                const isSelected = targetType === option.type;
                return (
                  <TouchableOpacity
                    key={option.type}
                    className={`flex-row items-center p-4 rounded-xl border ${
                      isSelected ? "bg-primary-500/10 border-primary-500" : "bg-surface-raised border-surface-overlay"
                    }`}
                    onPress={() => setTargetType(option.type)}
                    disabled={isSubmitting}
                  >
                    <View className="flex-1">
                      <Text className={`font-semi ${isSelected ? "text-primary-400" : "text-txt-primary"}`}>
                        {option.label}
                      </Text>
                      <Text className="text-txt-muted text-xs mt-1">{option.description}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#1E88E5" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {targetType === "team" && (
            <View className="mb-6">
              <Text className="text-txt-secondary text-sm font-bold uppercase mb-3">Select Team</Text>
              {isLoadingTeams ? (
                <View className="items-center py-6">
                  <ActivityIndicator color="#1E88E5" />
                </View>
              ) : teams.length === 0 ? (
                <View className="bg-surface-raised rounded-xl p-6 items-center">
                  <Ionicons name="people-outline" size={32} color="#484F58" />
                  <Text className="text-txt-muted text-sm mt-2">No teams available</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-5 px-5"
                >
                  <View className="flex-row gap-2">
                    {teams.map(team => {
                      const isSelected = targetId === team.id;
                      return (
                        <TouchableOpacity
                          key={team.id}
                          className={`px-4 py-3 rounded-xl border ${
                            isSelected
                              ? "bg-primary-500 border-primary-500"
                              : "bg-surface-raised border-surface-overlay"
                          }`}
                          onPress={() => setTargetId(team.id)}
                          disabled={isSubmitting}
                        >
                          <Text className={`font-semi ${
                            isSelected ? "text-white" : "text-txt-secondary"
                          }`}>
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

          <View className="mb-6">
            <Text className="text-txt-secondary text-sm font-bold uppercase mb-3">Expiration</Text>
            <View className="flex-row flex-wrap gap-2">
              {EXPIRATION_OPTIONS.map(option => {
                const isSelected = expirationHours === option.hours;
                return (
                  <TouchableOpacity
                    key={option.label}
                    className={`flex-1 min-w-[100px] p-3 rounded-xl border flex-col items-center ${
                      isSelected
                        ? "bg-primary-500 border-primary-500"
                        : "bg-surface-raised border-surface-overlay"
                    }`}
                    onPress={() => setExpirationHours(option.hours)}
                    disabled={isSubmitting}
                  >
                    <Text className={`font-semi text-sm ${
                      isSelected ? "text-white" : "text-txt-primary"
                    }`}>
                      {option.label}
                    </Text>
                    <Text className={`text-[10px] mt-1 ${
                      isSelected ? "text-white/70" : "text-txt-muted"
                    }`}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className={`rounded-2xl p-4 mb-8 ${isUrgent ? "bg-danger/10 border border-danger/30" : "bg-surface border border-surface-overlay"}`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="warning" size={18} color={isUrgent ? "#E53935" : "#8B949E"} />
                  <Text className={`font-bold ${isUrgent ? "text-danger" : "text-txt-primary"}`}>
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
                trackColor={{ false: "#30363D", true: "#E53935" }}
                thumbColor="#F0F6FC"
                disabled={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}