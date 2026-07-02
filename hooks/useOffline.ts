import { useState, useEffect, useCallback } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

interface UseOfflineResult {
  isOffline: boolean;
  isConnected: boolean | null;
  retry: () => void;
}

function deriveState(state: NetInfoState): { isConnected: boolean | null; isOffline: boolean } {
  const isConnected = state.isConnected ?? null;
  const isOffline = isConnected === false;
  return { isConnected, isOffline };
}

function logTransition(
  prev: boolean | null,
  next: boolean | null
): void {
  if (prev === null) return;
  if (prev === false && next === true) {
    console.log("Network restored");
  } else if (prev === true && next === false) {
    console.log("Network lost");
  }
}

export function useOffline(): UseOfflineResult {
  const [state, setState] = useState<{
    isConnected: boolean | null;
    isOffline: boolean;
  }>(() => ({ isConnected: null, isOffline: false }));

  const applyState = useCallback((next: NetInfoState) => {
    setState((prev) => {
      const derived = deriveState(next);
      logTransition(prev.isConnected, derived.isConnected);
      return derived;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await NetInfo.fetch();
      applyState(next);
    } catch (err) {
      console.warn("Failed to query connectivity:", err);
    }
  }, [applyState]);

  useEffect(() => {
    refresh();

    const unsubscribe = NetInfo.addEventListener((next) => {
      applyState(next);
    });

    return () => {
      unsubscribe();
    };
  }, [refresh, applyState]);

  return {
    isOffline: state.isOffline,
    isConnected: state.isConnected,
    retry: refresh,
  };
}

export function useOnline(): boolean {
  const { isConnected } = useOffline();
  return isConnected === true;
}
