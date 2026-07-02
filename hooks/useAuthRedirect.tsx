import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export function useAuthRedirect(): void {
  const { isAuthenticated, isLoading } = useAuthStore();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || redirected.current) return;
    if (!isAuthenticated) {
      redirected.current = true;
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading]);
}
