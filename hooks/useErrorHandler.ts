import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/errors";

interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { onError, showToast = false } = options;
  const queryClient = useQueryClient();

  const handleError = useCallback((error: unknown, context?: string) => {
    const message = getErrorMessage(error);
    const errorWithContext = context 
      ? new Error(`${context}: ${message}`) 
      : new Error(message);

    if (onError) {
      onError(errorWithContext);
    }

    if (showToast) {
      console.error("Error:", message);
    }
  }, [onError, showToast]);

  const retryQuery = useCallback((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  return {
    handleError,
    retryQuery,
  };
}

export function useRefetchOnError() {
  const queryClient = useQueryClient();

  return useCallback((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);
}