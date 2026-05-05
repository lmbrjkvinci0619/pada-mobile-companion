import React from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={["#161B22", "#0D1117"]}
          className="px-5 pt-8 pb-12 rounded-b-[50px] shadow-2xl items-center"
        >
          <View className="relative">
            <Avatar 
              name={`${user?.firstName} ${user?.lastName}`} 
              uri={user?.avatarUrl} 
              size="xl" 
              className="border-4 border-primary-500/20"
            />
            <View className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full border-4 border-[#161B22] items-center justify-center">
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          </View>
          
          <Text className="text-txt-primary text-3xl font-black mt-6">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-primary-300 text-sm font-bold opacity-80">{user?.email}</Text>
          
          <View className="bg-primary-500/10 px-4 py-1.5 rounded-2xl mt-4 border border-primary-500/20">
            <Text className="text-primary-200 text-[10px] font-black uppercase tracking-[2px]">{user?.role}</Text>
          </View>
        </LinearGradient>

        <View className="px-5 mt-8">
          <Text className="text-txt-primary text-lg font-black mb-4">Settings & Privacy</Text>
          
          <View className="bg-surface rounded-3xl overflow-hidden border border-surface-border/30 mb-6">
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-surface-overlay">
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-primary-500/10 items-center justify-center">
                  <Ionicons name="notifications" size={20} color="#388BFD" />
                </View>
                <Text className="text-txt-primary text-base font-bold">Push Notifications</Text>
              </View>
              <Switch 
                value={pushEnabled} 
                onValueChange={setPushEnabled}
                trackColor={{ false: "#30363D", true: "#1F6FEB" }}
                thumbColor="#F0F6FC"
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.7}
              className="flex-row items-center justify-between px-6 py-5 border-b border-surface-overlay"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-accent/10 items-center justify-center">
                  <Ionicons name="shield-checkmark" size={20} color="#3FB950" />
                </View>
                <Text className="text-txt-primary text-base font-bold">Security & Privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#484F58" />
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              className="flex-row items-center justify-between px-6 py-5"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-warning/10 items-center justify-center">
                  <Ionicons name="help-circle" size={20} color="#D29922" />
                </View>
                <Text className="text-txt-primary text-base font-bold">Support & Feedback</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#484F58" />
            </TouchableOpacity>
          </View>

          <Text className="text-txt-primary text-lg font-black mb-4">Developer Tools</Text>
          <View className="bg-surface rounded-3xl overflow-hidden border border-surface-border/30 mb-8">
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => router.push("/debug/ui-gallery")}
              className="flex-row items-center justify-between px-6 py-5"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-2xl bg-primary-500/10 items-center justify-center">
                  <Ionicons name="color-palette" size={20} color="#388BFD" />
                </View>
                <View>
                  <Text className="text-txt-primary text-base font-bold">UI Component Gallery</Text>
                  <Text className="text-txt-secondary text-xs">Preview design system tokens</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#484F58" />
            </TouchableOpacity>
          </View>

          <Button 
            variant="ghost" 
            label="Log Out" 
            onPress={logout}
            className="mb-12 border-danger/30"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

