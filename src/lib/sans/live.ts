import { useQuery } from "@tanstack/react-query";
import { fetchDataset, SANS_API_URL } from "./api";

/** Probes the configured backend once. Live mode is offered only when this returns verified data. */
export function useLiveProbe() {
  const q = useQuery({
    queryKey: ["sans-live-probe", SANS_API_URL],
    queryFn: () => fetchDataset({ astronautId: "ASTRO001", scenario: "progressive", onsetRate: 1, noise: 1, uploads: [] }, "live"),
    enabled: Boolean(SANS_API_URL),
    retry: false,
    staleTime: 60_000,
  });
  return { configured: Boolean(SANS_API_URL), verified: q.data?.source === "live", checking: q.isFetching, error: q.error as Error | null };
}
