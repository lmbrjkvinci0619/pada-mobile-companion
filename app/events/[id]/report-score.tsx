import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { fetchEvent } from "@/services/topscore";
import type { Event, EventStatus } from "@/types";
import { Button } from "@/components/ui/Button";

function ScoreAdjuster({ 
   teamName, 
   score, 
   onChange 
}: { 
   teamName: string; 
   score: number; 
   onChange: (s: number) => void 
}) {
   return (
      <View className="bg-surface rounded-2xl p-5 items-center flex-1">
         <Text className="text-txt-secondary text-sm font-bold text-center h-10 mb-2" numberOfLines={2}>{teamName}</Text>
         <Text className="text-white text-5xl font-black my-4">{score}</Text>
         <View className="flex-row gap-3">
            <TouchableOpacity 
               className="w-12 h-12 rounded-full bg-surface-raised border border-surface-overlay justify-center items-center"
               onPress={() => onChange(Math.max(0, score - 1))}
            >
               <Ionicons name="remove" size={24} color="#E6EDF3" />
            </TouchableOpacity>
            <TouchableOpacity 
               className="w-12 h-12 rounded-full bg-primary-500 justify-center items-center"
               onPress={() => onChange(score + 1)}
            >
               <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
         </View>
      </View>
   );
}

export default function ReportScoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [status, setStatus] = useState<EventStatus>("in_progress");

  useEffect(() => {
    if (id) {
       fetchEvent(id as string).then(e => {
          if (e) {
             setEvent(e);
             if (e.score) {
                setHomeScore(e.score.homeScore);
                setAwayScore(e.score.awayScore);
             }
             if (e.status === "completed" || e.status === "cancelled") {
                setStatus(e.status as EventStatus);
             }
          }
       });
    }
  }, [id]);

  const handleSubmit = () => {
     // In production, sync to Supabase 'game_scores' table
     console.log("Submitting Score:", { id, homeScore, awayScore, status });
     router.back();
  };

  if (!event) return null;

  const homeTeamName = event.teamName || "Home";
  const awayTeamName = event.opponentName || "Away";

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="px-5 py-4 flex-row items-center justify-between border-b border-surface-overlay">
         <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary-400 font-semi text-base">Cancel</Text>
         </TouchableOpacity>
         <Text className="text-txt-primary text-lg font-bold">Report Score</Text>
         <TouchableOpacity onPress={handleSubmit}>
            <Text className="text-accent font-bold text-base">Save</Text>
         </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-6">
         <View className="flex-row gap-4 mb-8">
            <ScoreAdjuster teamName={homeTeamName} score={homeScore} onChange={setHomeScore} />
            <ScoreAdjuster teamName={awayTeamName} score={awayScore} onChange={setAwayScore} />
         </View>

         <Text className="text-txt-secondary text-sm font-bold uppercase mb-3 ml-2">Game Status</Text>
         <View className="bg-surface rounded-2xl overflow-hidden mb-8">
            <TouchableOpacity 
               className={`px-5 py-4 border-b border-surface-overlay flex-row items-center justify-between ${status === 'in_progress' ? 'bg-primary-500/10' : ''}`}
               onPress={() => setStatus("in_progress")}
            >
               <Text className={`font-semi text-base ${status === 'in_progress' ? 'text-primary-300' : 'text-txt-primary'}`}>In Progress</Text>
               {status === "in_progress" && <Ionicons name="checkmark" size={20} color="#64B5F6" />}
            </TouchableOpacity>
            
            <TouchableOpacity 
               className={`px-5 py-4 border-b border-surface-overlay flex-row items-center justify-between ${status === 'completed' ? 'bg-primary-500/10' : ''}`}
               onPress={() => setStatus("completed")}
            >
               <Text className={`font-semi text-base ${status === 'completed' ? 'text-primary-300' : 'text-txt-primary'}`}>Completed (Final)</Text>
               {status === "completed" && <Ionicons name="checkmark" size={20} color="#64B5F6" />}
            </TouchableOpacity>

            <TouchableOpacity 
               className={`px-5 py-4 flex-row items-center justify-between ${status === 'cancelled' ? 'bg-primary-500/10' : ''}`}
               onPress={() => setStatus("cancelled")}
            >
               <Text className={`font-semi text-base ${status === 'cancelled' ? 'text-primary-300' : 'text-txt-primary'}`}>Cancelled</Text>
               {status === "cancelled" && <Ionicons name="checkmark" size={20} color="#64B5F6" />}
            </TouchableOpacity>
         </View>

         <Button 
            label="Submit Score" 
            variant="success" 
            onPress={handleSubmit} 
         />
      </ScrollView>
    </SafeAreaView>
  );
}
