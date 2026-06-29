import { useState, useEffect, useCallback } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

interface UseOfflineResult {
  isOffline: boolean;
  isConnected: boolean | null;
  retry: () => void;
}

function deriveState(state: NetInfoState): { isConnected: boolean | null; isOffline: boolean } {
  const isConnected = state.isConnected;
  const isOffline = isConnected === false;
  return {
    isConnected,
    isOffline,
  };
}

export function useOffline(): UseOfflineResult {
  const [state, setState] = useState<{
    isConnected: boolean | null;
    isOffline: boolean;
  }>(() => ({ isConnected: null, isOffline: false }));

  const refresh = useCallback(async () => {
    try {
      const next = await NetInfo.fetch();
      setState((prev) => {
        const derived = deriveState(next);
        if (prev.isConnected === false && derived.isConnected === true) {
          console.log("Network restored");
        } else if (prev.isConnected === true && derived.isConnected === false) {
          console.log("Network lost");
        }
        return derived;
      });
    } catch (err) {
      console.warn("Failed to query connectivity:", err);
    }
  }, []);

  useEffect(() => {
    refresh();

    const unsubscribe = NetInfo.addEventListener((next) => {
      setState((prev) => {
        const derived = deriveState(next);
        if (prev.isConnected === false && derived.isConnected === true) {
          console.log("Network restored");
        } else if (prev.isConnected === true && derived.isConnected === false) {
          console.log("Network lost");
        }
        return derived;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [refresh]);

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
