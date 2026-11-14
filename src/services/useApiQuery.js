import { useQuery } from "@tanstack/react-query";
import { endpointStatus } from "./api";

/**
 * Thin wrapper over React Query for backend reads.
 * Requests are skipped (not fired) while the endpoint is pending/unconfigured,
 * and `status` explains why to the UI.
 */
export function useApiQuery(endpointKey, fetcher) {
  const readiness = endpointStatus(endpointKey);
  const query = useQuery({
    queryKey: ["api", endpointKey],
    queryFn: fetcher,
    enabled: readiness === "ready",
    retry: (count, err) => count < 1 && err?.kind !== "invalid_response" && err?.kind !== "http_error",
    staleTime: 60_000,
  });
  return { ...query, readiness };
}
