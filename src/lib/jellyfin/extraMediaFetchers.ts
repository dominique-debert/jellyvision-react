import {
  getNextUpItems,
  getLatestMedia,
  getUserViews,
} from "@/lib/jellyfin/client";
import { useQuery } from "@tanstack/react-query";

export async function fetchNextUp(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  const result = await getNextUpItems(serverUrl, userId, accessToken, 60);
  if (!result.success) throw new Error("Failed to fetch Next Up items");
  return result.data;
}

export async function fetchRecentlyAddedMovies(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  const views = await getUserViews(serverUrl, userId, accessToken);
  if (!views.success) throw new Error("Failed to fetch user views");
  const moviesLib = views.data.find(
    (v: { Id?: string; CollectionType?: string }) => v.CollectionType === "movies" && typeof v.Id === "string"
  );
  if (!moviesLib || !moviesLib.Id) return [];
  const result = await getLatestMedia(
    serverUrl,
    userId,
    accessToken,
    moviesLib.Id,
    60,
  );
  if (!result.success) throw new Error("Failed to fetch latest movies");
  return result.data;
}

export async function fetchRecentlyAddedShows(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  const views = await getUserViews(serverUrl, userId, accessToken);
  if (!views.success) throw new Error("Failed to fetch user views");
  const showsLib = views.data.find(
    (v: { Id?: string; CollectionType?: string }) => v.CollectionType === "tvshows" && typeof v.Id === "string"
  );
  if (!showsLib) return [];
  const result = await getLatestMedia(
    serverUrl,
    userId,
    accessToken,
    showsLib.Id,
    60,
  );
  if (!result.success) throw new Error("Failed to fetch latest shows");
  return result.data;
}

export async function fetchRecentlyAddedMusic(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  const views = await getUserViews(serverUrl, userId, accessToken);
  if (!views.success) throw new Error("Failed to fetch user views");
  const musicLib = views.data.find(
    (v: { Id?: string; CollectionType?: string }) => v.CollectionType === "music" && typeof v.Id === "string"
  );
  if (!musicLib) return [];
  const result = await getLatestMedia(
    serverUrl,
    userId,
    accessToken,
    musicLib.Id,
    60,
  );
  if (!result.success) throw new Error("Failed to fetch latest music");
  return result.data;
}

// TanStack Query hooks for each fetcher

export function useNextUpQuery(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  return useQuery({
    queryKey: ["nextUp", serverUrl, userId, accessToken],
    queryFn: () => fetchNextUp(serverUrl, userId, accessToken),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });
}

export function useRecentlyAddedMoviesQuery(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  return useQuery({
    queryKey: ["recentMovies", serverUrl, userId, accessToken],
    queryFn: () => fetchRecentlyAddedMovies(serverUrl, userId, accessToken),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });
}

export function useRecentlyAddedShowsQuery(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  return useQuery({
    queryKey: ["recentShows", serverUrl, userId, accessToken],
    queryFn: () => fetchRecentlyAddedShows(serverUrl, userId, accessToken),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });
}

export function useRecentlyAddedMusicQuery(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  return useQuery({
    queryKey: ["recentMusic", serverUrl, userId, accessToken],
    queryFn: () => fetchRecentlyAddedMusic(serverUrl, userId, accessToken),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });
}
