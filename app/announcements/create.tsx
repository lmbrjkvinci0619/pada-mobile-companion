import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { createAnnouncement } from "@/services/announcements";
import { fetchTeams } from "@/services/topscore";
import { AnnouncementTargetType, Team } from "@/types";

export default function CreateAnnouncementScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [targetType, setTargetType] = useState<AnnouncementTargetType>("team");
  const [targetId, setTargetId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  const canPostLeague = user?.role === "league_admin";

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await fetchTeams();
      setTeams(data);
      if (data.length > 0 && !targetId) {
        setTargetId(data[0].id);
      }
    } catch (err) {
      console.error("Error loading teams:", err);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handlePost = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to post announcements");
      return;
    }

    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in both title and message");
      return;
    }

    const finalTargetId = targetType === "league" 
      ? canPostLeague ? "global-league" : ""
      : targetId;

    if (targetType === "team" && !finalTargetId) {
      Alert.alert("Error", "Please select a team");
      return;
    }

    setIsSubmitting(true);
    
    const success = await createAnnouncement({
      authorId: user.id,
      authorName: user.firstName + " " + user.lastName,
      authorRole: user.role === "league_admin" ? "league_admin" : "team_captain",
      targetType,
      targetId: finalTargetId,
      title: title.trim(),
      content: content.trim(),
      isUrgent,
    });

    setIsSubmitting(false);
    if (success) {
      router.back();
    } else {
      Alert.alert("Error", "Failed to post announcement. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
            <Ionicons name="close" size={24} color="#E6EDF3" />
          </TouchableOpacity>
          <Text className="text-txt-primary text-xl font-bold">New Announcement</Text>
        </View>
        {isSubmitting ? (
          <ActivityIndicator color="#1E88E5" />
        ) : (
          <Button 
            label="Post" 
            size="sm" 
            onPress={handlePost} 
            disabled={!title.trim() || !content.trim() || (targetType === "team" && !targetId)}
          />
        )}
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        <View className="mb-4">
          <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">Title</Text>
          <TextInput
            className="bg-surface-raised border border-surface-overlay text-txt-primary text-base px-4 py-3 rounded-xl"
            placeholder="Announcement Title"
            placeholderTextColor="#8B949E"
            value={title}
            onChangeText={setTitle}
            editable={!isSubmitting}
          />
        </View>

        <View className="mb-4">
          <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">Message</Text>
          <TextInput
            className="bg-surface-raised border border-surface-overlay text-txt-primary text-base px-4 py-3 rounded-xl min-h-[120px]"
            placeholder="Write your message here..."
            placeholderTextColor="#8B949E"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            editable={!isSubmitting}
          />
        </View>

        {canPostLeague && (
          <View className="mb-6">
            <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">Audience</Text>
            <View className="flex-row rounded-xl overflow-hidden border border-surface-overlay">
              <TouchableOpacity 
                className={`flex-1 py-3 items-center ${targetType === "team" ? "bg-primary-500" : "bg-surface-raised"}`}
                onPress={() => setTargetType("team")}
                disabled={isSubmitting}
              >
                <Text className={`font-semi ${targetType === "team" ? "text-white" : "text-txt-secondary"}`}>Team Only</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 py-3 items-center border-l border-surface-overlay ${targetType === "league" ? "bg-primary-500" : "bg-surface-raised"}`}
                onPress={() => setTargetType("league")}
                disabled={isSubmitting}
              >
                <Text className={`font-semi ${targetType === "league" ? "text-white" : "text-txt-secondary"}`}>League-wide</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {targetType === "team" && (
          <View className="mb-6">
            <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">Select Team</Text>
            {isLoadingTeams ? (
              <ActivityIndicator color="#1E88E5" />
            ) : teams.length === 0 ? (
              <Text className="text-txt-muted">No teams found</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {teams.map(team => (
                  <TouchableOpacity
                    key={team.id}
                    className={`px-4 py-2 rounded-xl border ${
                      targetId === team.id 
                        ? "bg-primary-500 border-primary-500" 
                        : "bg-surface-raised border-surface-overlay"
                    }`}
                    onPress={() => setTargetId(team.id)}
                    disabled={isSubmitting}
                  >
                    <Text className={`font-semi ${
                      targetId === team.id ? "text-white" : "text-txt-secondary"
                    }`}>
                      {team.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View className="bg-surface rounded-2xl p-4 flex-row items-center justify-between mb-8">
          <View className="flex-1 mr-4">
            <Text className="text-danger font-bold text-base mb-1">Make Urgent</Text>
            <Text className="text-txt-muted text-xs">Send immediate push notifications to all targets. Use only for cancellations or emergencies.</Text>
          </View>
          <Switch 
            value={isUrgent} 
            onValueChange={setIsUrgent}
            trackColor={{ false: "#30363D", true: "#E53935" }}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}