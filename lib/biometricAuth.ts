import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "padahub_biometric_enabled";

const SENSITIVE_OPERATIONS = new Set<string>([
  "view:payments",
  "edit:profile",
  "view:medical",
  "export:data",
  "delete:account",
]);

export interface BiometricStatus {
  available: boolean;
  enrolled: boolean;
  biometricType: string | null;
}

async function getBiometricModule(): Promise<typeof import("expo-local-authentication") | null> {
  console.log("[Startup] biometricAuth: Attempting to load expo-local-authentication");
  try {
    const mod = await import("expo-local-authentication");
    console.log("[Startup] biometricAuth: expo-local-authentication loaded successfully");
    return mod;
  } catch (e) {
    console.warn("[Startup] biometricAuth: expo-local-authentication import failed:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

export async function getBiometricStatus(): Promise<BiometricStatus> {
  const LA = await getBiometricModule();
  if (!LA) {
    return { available: false, enrolled: false, biometricType: null };
  }

  try {
    const compatible = await LA.hasHardwareAsync();
    const enrolled = await LA.isEnrolledAsync();
    const types = await LA.supportedAuthenticationTypesAsync();

    let biometricType: string | null = null;
    if (types.includes(LA.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = "facial_recognition";
    } else if (types.includes(LA.AuthenticationType.FINGERPRINT)) {
      biometricType = "fingerprint";
    } else if (types.includes(LA.AuthenticationType.IRIS)) {
      biometricType = "iris";
    }

    return {
      available: compatible && enrolled,
      enrolled,
      biometricType,
    };
  } catch {
    return { available: false, enrolled: false, biometricType: null };
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? "true" : "false");
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export async function authenticateWithBiometrics(
  reason?: string
): Promise<BiometricAuthResult> {
  const LA = await getBiometricModule();
  if (!LA) {
    return { success: false, error: "Biometric authentication is not available" };
  }

  try {
    const status = await getBiometricStatus();
    if (!status.available) {
      return { success: false, error: "Biometric authentication is not available" };
    }

    const result = await LA.authenticateAsync({
      promptMessage: reason ?? "Authenticate to continue",
      cancelLabel: "Cancel",
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    }

    if (result.error === "user_cancel") {
      return { success: false, error: "Authentication cancelled" };
    }
    if (result.error === "user_fallback") {
      return { success: false, error: "Please use your passcode" };
    }
    if (result.error === "system_cancel") {
      return { success: false, error: "Authentication system cancelled" };
    }
    if (result.error === "lockout") {
      return { success: false, error: "Too many attempts. Please try again later." };
    }

    return { success: false, error: "Authentication failed" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Biometric authentication failed",
    };
  }
}

export async function requireBiometricForOperation(
  operation: string,
  fallbackReason?: string
): Promise<BiometricAuthResult> {
  if (!SENSITIVE_OPERATIONS.has(operation)) {
    return { success: true };
  }

  const enabled = await isBiometricEnabled();
  if (!enabled) {
    return { success: true };
  }

  return authenticateWithBiometrics(fallbackReason);
}

export function isSensitiveOperation(operation: string): boolean {
  return SENSITIVE_OPERATIONS.has(operation);
}

export function registerSensitiveOperation(operation: string): void {
  SENSITIVE_OPERATIONS.add(operation);
}