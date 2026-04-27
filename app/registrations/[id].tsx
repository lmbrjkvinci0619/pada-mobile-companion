import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchRegistrations } from "@/services/topscore";
import type { Registration } from "@/types";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { Card } from "@/components/ui/Card";
import { format, parseISO } from "date-fns";

export default function RegistrationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reg, setReg] = useState<Registration | null>(null);

  useEffect(() => {
    if (id) {
       fetchRegistrations().then(regs => {
          const found = regs.find(r => r.id === id);
          if (found) setReg(found);
       });
    }
  }, [id]);

  if (!reg) return null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
        </TouchableOpacity>
        <Text className="text-txt-primary text-xl font-bold flex-1" numberOfLines={1}>Registration Details</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
         <ReadOnlyBanner />
         <Text className="text-txt-primary text-2xl font-black mb-1">{reg.organizationName}</Text>
         <Text className="text-txt-secondary text-base mb-6 capitalize">{reg.type} Registration</Text>

         <Card elevated className="mb-4">
            <View className="flex-row justify-between mb-2">
               <Text className="text-txt-secondary text-sm font-bold uppercase">Status</Text>
               <Text className="text-txt-primary text-sm font-semi capitalize">{reg.status}</Text>
            </View>
            {reg.seasonName && (
               <View className="flex-row justify-between mb-2">
                  <Text className="text-txt-secondary text-sm font-bold uppercase">Season</Text>
                  <Text className="text-txt-primary text-sm font-semi">{reg.seasonName}</Text>
               </View>
            )}
            <View className="flex-row justify-between">
               <Text className="text-txt-secondary text-sm font-bold uppercase">Start Date</Text>
               <Text className="text-txt-primary text-sm font-semi">{format(parseISO(reg.startDate), "MMM d, yyyy")}</Text>
            </View>
         </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
