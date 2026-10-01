"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api/client";

/** GET an API path. The path is the cache key, so the same URL is fetched once and shared. */
export function useApiQuery<T>(path: string | null, options?: { refetchInterval?: number }) {
  return useQuery<T, ApiClientError>({
    queryKey: [path],
    queryFn: () => api<T>(path!),
    enabled: path !== null,
    refetchInterval: options?.refetchInterval,
  });
}

type MutationOptions<TBody, TResult> = {
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  /** Toast text on success; a function receives the response. Omit for no toast. */
  success?: string | ((data: TResult) => string | undefined);
  /** When given, field errors from the API (422) are shown under the matching inputs. */
  form?: { setError: (name: never, error: { message?: string }) => void };
  onSuccess?: (data: TResult, body: TBody) => void;
};

/**
 * POST/PUT/PATCH/DELETE an API path. On success every cached query is refetched,
 * so lists and counts on screen always reflect the change.
 */
export function useApiMutation<TBody = unknown, TResult = unknown>(
  path: string | ((body: TBody) => string),
  { method = "POST", success, form, onSuccess }: MutationOptions<TBody, TResult> = {},
) {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiClientError, TBody>({
    mutationFn: (body) => api<TResult>(typeof path === "function" ? path(body) : path, { method, body }),
    onSuccess: async (data, body) => {
      await queryClient.invalidateQueries();
      const message = typeof success === "function" ? success(data) : success;
      if (message) toast.success(message);
      onSuccess?.(data, body);
    },
    onError: (error) => {
      if (form && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          form.setError(field as never, { message: messages[0] });
        }
      }
      if (error.status !== 401) toast.error(error.message);
    },
  });
}
