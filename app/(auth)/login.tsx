import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { APP_NAME, SPORT_EMOJI } from "@/constants/config";
import { Button } from "@/components/ui/Button";
import { isValidEmail } from "@/lib/validation";

export default function LoginScreen() {
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
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
        {/* Logo / Brand */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 rounded-3xl bg-primary-500 items-center justify-center mb-4 shadow-lg">
            <Text className="text-4xl">{SPORT_EMOJI}</Text>
          </View>
          <Text className="text-txt-primary text-3xl font-black tracking-tight">
            {APP_NAME}
          </Text>
          <Text className="text-txt-secondary text-base font-mid mt-1">
            Your Pada.org Ultimate Frisbee companion
          </Text>
        </View>

        {/* Card */}
        <View className="w-full bg-surface rounded-3xl p-6 gap-5 shadow-xl border border-surface-overlay/30">
          <Text className="text-txt-primary text-xl font-bold text-center">
            Sign in to PadaHub
          </Text>

          {/* Error */}
          {(error || validationError) && (
            <View className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">
              <Text className="text-danger-light text-sm font-mid">{validationError || error}</Text>
            </View>
          )}

          {/* Email */}
          <View className="gap-2">
            <Text className="text-txt-secondary text-sm font-semi">Email</Text>
            <View className="flex-row items-center bg-surface-raised border border-surface-overlay rounded-xl px-4 py-3 gap-3">
              <Ionicons name="mail-outline" size={18} color="#8B949E" />
              <TextInput
                className="flex-1 text-txt-primary text-base font-mid"
                placeholder="your@email.com"
                placeholderTextColor="#484F58"
                value={email}
                onChangeText={(text) => { setEmail(text); setValidationError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View className="gap-2">
            <Text className="text-txt-secondary text-sm font-semi">Password</Text>
            <View className="flex-row items-center bg-surface-raised border border-surface-overlay rounded-xl px-4 py-3 gap-3">
              <Ionicons name="lock-closed-outline" size={18} color="#8B949E" />
              <TextInput
                className="flex-1 text-txt-primary text-base font-mid"
                placeholder="Your password"
                placeholderTextColor="#484F58"
                value={password}
                onChangeText={(text) => { setPassword(text); setValidationError(null); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#8B949E"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me */}
          <TouchableOpacity
            className="flex-row items-center gap-3"
            onPress={() => setRemember((v) => !v)}
          >
            <View
              className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                rememberMe
                  ? "bg-primary-500 border-primary-500"
                  : "border-surface-overlay"
              }`}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={12} color="#fff" />
              )}
            </View>
            <Text className="text-txt-secondary text-sm font-mid">
              Stay signed in for 30 days
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            label={isLoading ? "" : "Sign In"}
            loading={isLoading}
            onPress={handleLogin}
            disabled={!email || !password}
            className="mt-1"
          />

          {/* Forgot Password */}
          <TouchableOpacity
            className="items-center"
            onPress={() => Linking.openURL("https://pada.usetopscore.com/password_resets/new")}
          >
            <Text className="text-primary-400 text-sm font-semi">
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>

        </ScrollView>
    </KeyboardAvoidingView>
  );
}
