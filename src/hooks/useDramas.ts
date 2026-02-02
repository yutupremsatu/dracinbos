import { useQuery } from "@tanstack/react-query";
import type { Drama, SearchResult } from "@/types/drama";

const API_BASE = "/api/dramabox";

import { fetchJson } from "@/lib/fetcher";

// ... existing imports

export function useForYouDramas() {
  const { currentPlatform } = usePlatform();
  return useQuery({
    queryKey: ["dramas", "foryou", currentPlatform],
    queryFn: () => fetchJson<Drama[]>(`${API_BASE}/foryou?platform=${currentPlatform}`),
    staleTime: 1000 * 60 * 5,
  });
}

import { usePlatform } from "./usePlatform";

export function useLatestDramas() {
  const { currentPlatform } = usePlatform();
  return useQuery({
    queryKey: ["dramas", "latest", currentPlatform],
    queryFn: () => fetchJson<Drama[]>(`${API_BASE}/latest?platform=${currentPlatform}`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTrendingDramas() {
  const { currentPlatform } = usePlatform();
  return useQuery({
    queryKey: ["dramas", "trending", currentPlatform],
    queryFn: () => fetchJson<Drama[]>(`${API_BASE}/trending?platform=${currentPlatform}`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchDramas(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ["dramas", "search", normalizedQuery],
    queryFn: async () => {
      if (!normalizedQuery) return [];
      return fetchJson<SearchResult[]>(`${API_BASE}/search?query=${encodeURIComponent(normalizedQuery)}`);
    },
    enabled: normalizedQuery.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDubindoDramas() {
  return useQuery({
    queryKey: ["dramas", "dubindo"],
    queryFn: () => fetchJson<Drama[]>(`${API_BASE}/dubindo`),
    staleTime: 1000 * 60 * 5,
  });
}

