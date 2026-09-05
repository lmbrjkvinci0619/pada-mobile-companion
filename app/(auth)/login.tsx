import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { APP_NAME } from "@/constants/config";
import { useColors } from "@/lib/tokens";
import { Button } from "@/components/ui/Button";
import { Title, Eyebrow, Body, Label } from "@/components/ui";
import { isValidEmail } from "@/lib/validation";
import { openUrl } from "@/lib/urlUtils";

export default function LoginScreen() {
  const colors = useColors();
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
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow items-center justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <View
            className="w-24 h-24 items-center justify-center mb-6"
            style={{ backgroundColor: colors.primary }}
          >
            <Title style={{ color: colors.txtInverse }} className="text-[64px] font-light leading-none">
              p
            </Title>
          </View>
          <Title>{APP_NAME}</Title>
          <View className="flex-row items-center gap-2 mt-3">
            <View className="h-px w-6" style={{ backgroundColor: colors.primary }} />
            <Eyebrow tone="secondary">pada.org companion</Eyebrow>
            <View className="h-px w-6" style={{ backgroundColor: colors.primary }} />
          </View>
        </View>

        <View className="w-full bg-surface border border-surface-border p-6 gap-5">
          <Label tone="primary" className="text-xl text-center tracking-[0.2em]">
            sign in
          </Label>

          {(error || validationError) && (
            <View
              className="flex-row items-start gap-3 border border-danger px-4 py-3"
              style={{ backgroundColor: colors.surface }}
              accessibilityRole="alert"
            >
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Body tone="danger" className="text-sm flex-1">
                {validationError || error}
              </Body>
            </View>
          )}

          <View className="gap-2">
            <Eyebrow tone="secondary" className="tracking-[0.18em]">email</Eyebrow>
            <View className="flex-row items-center bg-surface-raised border border-surface-border px-4 py-3 gap-3">
              <Ionicons name="mail-outline" size={18} color={colors.txtSecondary} />
              <TextInput
                className="flex-1 text-txt-primary text-sm"
                placeholder="your@email.com"
                placeholderTextColor={colors.txtMuted}
                value={email}
                onChangeText={(text) => { setEmail(text); setValidationError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                spellCheck={false}
                returnKeyType="next"
              />
            </View>
          </View>

          <View className="gap-2">
            <Eyebrow tone="secondary" className="tracking-[0.18em]">password</Eyebrow>
            <View className="flex-row items-center bg-surface-raised border border-surface-border px-4 py-3 gap-3">
              <Ionicons name="lock-closed-outline" size={18} color={colors.txtSecondary} />
              <TextInput
                className="flex-1 text-txt-primary text-sm"
                placeholder="Your password"
                placeholderTextColor={colors.txtMuted}
                value={password}
                onChangeText={(text) => { setPassword(text); setValidationError(null); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPass((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={showPass ? "hide password" : "show password"}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={colors.txtSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className="flex-row items-center gap-3 py-2 self-start"
            onPress={() => setRemember((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMe }}
            accessibilityLabel="stay signed in for 30 days"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View
              className={`w-5 h-5 items-center justify-center ${
                rememberMe ? "" : "bg-surface-raised border border-surface-border"
              }`}
              style={rememberMe ? { backgroundColor: colors.primary } : undefined}
            >
              {rememberMe && <Ionicons name="checkmark" size={12} color={colors.txtInverse} />}
            </View>
            <Label tone="secondary">stay signed in for 30 days</Label>
          </TouchableOpacity>

          <Button
            label={isLoading ? "" : "Sign In"}
            loading={isLoading}
            onPress={handleLogin}
            disabled={!email || !password}
            className="mt-1"
          />

          <TouchableOpacity
            className="items-center py-2"
            onPress={() => openUrl("https://pada.usetopscore.com/password_resets/new")}
            accessibilityRole="link"
            accessibilityLabel="reset your password"
          >
            <Eyebrow tone="primaryAccent">forgot password?</Eyebrow>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}