import * as SecureStore from "expo-secure-store";

const DEVICE_INTEGRITY_KEY = "padahub_device_integrity";
const INTEGRITY_CHECK_INTERVAL_MS = 30 * 60 * 1000;

interface DeviceIntegrityState {
  isSecure: boolean;
  lastChecked: number;
  riskFlags: RiskIndicator[];
}

const RISK_INDICATORS = [
  "emulator",
  "rooted",
  "jailbroken",
  "debugger_attached",
  "mock_location",
  "adb_enabled",
] as const;

export type RiskIndicator = typeof RISK_INDICATORS[number];

export interface DeviceIntegrityResult {
  isSecure: boolean;
  riskFlags: RiskIndicator[];
  lastChecked: number;
  shouldBlockAccess: boolean;
}

async function checkSimulator(): Promise<boolean> {
  try {
    if (typeof process === "object" && process.env) {
      if (process.env.E2E === "true" || process.env.CI === "true") {
        return true;
      }
    }
    const { Platform } = await import("react-native");
    if (Platform.OS === "ios") {
      const result = await import("react-native").then(m =>
        m.NativeModules?.UXCam?.isSimulator
      );
      if (result === true) return true;
    }
  } catch {}
  return false;
}

async function checkRootIndicators(): Promise<RiskIndicator[]> {
  const risks: RiskIndicator[] = [];

  try {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("android") && (ua.includes("emulator") || ua.includes("simulator"))) {
        risks.push("emulator");
      }
    }
  } catch {}

  try {
    const testPaths = [
      "/system/app/Superuser.apk",
      "/sbin/su",
      "/system/bin/su",
      "/system/xbin/su",
      "/data/local/xbin/su",
      "/data/local/bin/su",
      "/system/sd/xbin/su",
      "/system/bin/failsafe/su",
      "/data/local/su",
      "/su/bin/su",
    ];

    for (const path of testPaths) {
      try {
        if (typeof fetch !== "undefined") {
          const response = await fetch(`file://${path}`, { method: "HEAD" });
          if (response.ok) {
            risks.push("rooted");
            break;
          }
        }
      } catch {}
    }
  } catch {}

  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const debuggerDetected = (() => {
        const start = Date.now();
        debugger;
        const elapsed = Date.now() - start;
        return elapsed > 100;
      })();
      if (debuggerDetected) {
        risks.push("debugger_attached");
      }
    }
  } catch {}

  return risks;
}

async function checkAdbEnabled(): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      const adbEnabled = (window as unknown as { usb?: unknown }).usb;
      if (adbEnabled !== undefined) {
        return true;
      }
    }
  } catch {}
  return false;
}

export async function performDeviceIntegrityCheck(): Promise<DeviceIntegrityState> {
  const riskFlags: RiskIndicator[] = [];

  const rootRisks = await checkRootIndicators();
  riskFlags.push(...rootRisks);

  const isEmulator = await checkSimulator();
  if (isEmulator && !riskFlags.includes("emulator")) {
    riskFlags.push("emulator");
  }

  const adbEnabled = await checkAdbEnabled();
  if (adbEnabled && !riskFlags.includes("adb_enabled")) {
    riskFlags.push("adb_enabled");
  }

  return {
    isSecure: riskFlags.length === 0,
    lastChecked: Date.now(),
    riskFlags,
  };
}

export async function getDeviceIntegrity(): Promise<DeviceIntegrityResult> {
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_INTEGRITY_KEY);
    if (stored) {
      const state: DeviceIntegrityState = JSON.parse(stored);
      const now = Date.now();
      if (now - state.lastChecked < INTEGRITY_CHECK_INTERVAL_MS) {
        return {
          isSecure: state.isSecure,
          riskFlags: state.riskFlags as RiskIndicator[],
          lastChecked: state.lastChecked,
          shouldBlockAccess: state.riskFlags.length > 0,
        };
      }
    }
  } catch {}

  const freshResult = await performDeviceIntegrityCheck();
  await SecureStore.setItemAsync(DEVICE_INTEGRITY_KEY, JSON.stringify(freshResult)).catch(() => {});

  return {
    isSecure: freshResult.isSecure,
    riskFlags: freshResult.riskFlags,
    lastChecked: freshResult.lastChecked,
    shouldBlockAccess: freshResult.riskFlags.length > 0,
  };
}

export async function clearDeviceIntegrityCache(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_INTEGRITY_KEY).catch(() => {});
}

export function getRiskIndicatorLabel(risk: RiskIndicator): string {
  const labels: Record<RiskIndicator, string> = {
    emulator: "Running in device emulator",
    rooted: "Device is rooted",
    jailbroken: "Device is jailbroken",
    debugger_attached: "Debugger is attached",
    mock_location: "Mock location is enabled",
    adb_enabled: "USB debugging is enabled",
  };
  return labels[risk] ?? risk;
}