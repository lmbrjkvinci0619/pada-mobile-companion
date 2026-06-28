import { useState, useEffect, useCallback } from "react";

interface UseOfflineResult {
  isOffline: boolean;
  isConnected: boolean | null;
  retry: () => void;
}

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

export function useOffline(): UseOfflineResult {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    checkConnectivity().then((connected) => {
      setIsConnected(connected);
      setIsOffline(!connected);
    });

    const interval = setInterval(() => {
      checkConnectivity().then((connected) => {
        setIsConnected((prev) => {
          const wasOffline = prev === false;
          setIsOffline(!connected);
          
          if (wasOffline && connected) {
            console.log("Network restored");
          } else if (!wasOffline && !connected) {
            console.log("Network lost");
          }
          
          return connected;
        });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const retry = useCallback(() => {
    checkConnectivity().then((connected) => {
      setIsConnected(connected);
      setIsOffline(!connected);
    });
  }, []);

  return {
    isOffline,
    isConnected,
    retry,
  };
}

export function useOnline(): boolean {
  const { isConnected } = useOffline();
  return isConnected === true;
}