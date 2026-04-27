import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { createAnnouncement } from "@/services/announcements";
import { AnnouncementTargetType } from "@/types";

export default function CreateAnnouncementScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [targetType, setTargetType] = useState<AnnouncementTargetType>("team");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only league admins can post league-wide announcements
  const canPostLeague = user?.role === "league_admin";

  const handlePost = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    // For V1, we simulate posting to the first team they belong to if targetType is 'team'.
    // Ideally, we'd have a picker to select which team or division they want to target.
    // For now, we will target "all" or some generic ID, but since schema requires a string ID:
    const targetId = targetType === "league" ? "global-league" : "test-team-id"; // Simplification for UI

    const success = await createAnnouncement({
      authorId: user.id,
      authorName: user.firstName + " " + user.lastName,
      authorRole: user.role === "league_admin" ? "league_admin" : "team_captain",
      targetType,
      targetId,
      title,
      content,
      isUrgent,
    });

    setIsSubmitting(false);
    if (success) {
      router.back();
    } else {
      alert("Failed to post announcement");
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
              disabled={!title.trim() || !content.trim()}
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
