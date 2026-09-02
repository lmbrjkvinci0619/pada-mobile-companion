import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { APP_NAME, SPORT_EMOJI } from "@/constants/config";
import { Button } from "@/components/ui/Button";
import { isValidEmail } from "@/lib/validation";
import { openUrl } from "@/lib/urlUtils";

export default function LoginScreen() {
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRemember] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setValidationError("Please enter both email and password.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    setValidationError(null);
    const ok = await login(trimmedEmail, password, rememberMe);
    if (ok) router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow items-center justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-primary items-center justify-center mb-5 border-2 border-primary-700">
            <Text className="text-5xl">{SPORT_EMOJI}</Text>
          </View>
          <Text className="text-primary text-5xl font-light lowercase tracking-tight">
            {APP_NAME}
          </Text>
          <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-[0.2em] mt-2 text-center">
            your pada.org ultimate frisbee companion
          </Text>
        </View>

        <View className="w-full bg-surface border-2 border-surface-border p-6 gap-5">
          <Text className="text-txt-primary text-xl font-bold uppercase tracking-[0.2em] text-center">
            Sign In
          </Text>

          {(error || validationError) && (
            <View className="flex-row items-start gap-3 bg-danger/10 border-2 border-danger px-4 py-3">
              <Ionicons name="alert-circle" size={18} color="#E51400" />
              <Text className="text-danger text-sm font-bold flex-1">{validationError || error}</Text>
            </View>
          )}

          <View className="gap-2">
            <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-[0.18em]">Email</Text>
            <View className="flex-row items-center bg-surface border-2 border-surface-border px-4 py-3 gap-3">
              <Ionicons name="mail-outline" size={18} color="#5C5C5C" />
              <TextInput
                className="flex-1 text-txt-primary text-sm"
                placeholder="your@email.com"
                placeholderTextColor="#8A8A8A"
                value={email}
                onChangeText={(text) => { setEmail(text); setValidationError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-[0.18em]">Password</Text>
            <View className="flex-row items-center bg-surface border-2 border-surface-border px-4 py-3 gap-3">
              <Ionicons name="lock-closed-outline" size={18} color="#5C5C5C" />
              <TextInput
                className="flex-1 text-txt-primary text-sm"
                placeholder="Your password"
                placeholderTextColor="#8A8A8A"
                value={password}
                onChangeText={(text) => { setPassword(text); setValidationError(null); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color="#5C5C5C" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className="flex-row items-center gap-3"
            onPress={() => setRemember((v) => !v)}
          >
            <View
              className={`w-5 h-5 border-2 items-center justify-center ${
                rememberMe ? "bg-primary border-primary" : "border-surface-border"
              }`}
            >
              {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text className="text-txt-secondary text-xs font-bold uppercase tracking-wider">
              Stay signed in for 30 days
            </Text>
          </TouchableOpacity>

          <Button
            label={isLoading ? "" : "Sign In"}
            loading={isLoading}
            onPress={handleLogin}
            disabled={!email || !password}
            className="mt-1"
          />

          <TouchableOpacity
            className="items-center"
            onPress={() => openUrl("https://pada.usetopscore.com/password_resets/new")}
          >
            <Text className="text-primary text-[11px] font-bold uppercase tracking-[0.2em]">
              forgot password?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}