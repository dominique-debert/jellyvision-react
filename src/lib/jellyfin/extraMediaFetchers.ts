import {
  getNextUpItems,
  getLatestMedia,
  getUserViews,
} from "@/lib/jellyfin/client";

export async function fetchNextUp(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  return getNextUpItems(serverUrl, userId, accessToken, 60);
}

export async function fetchRecentlyAddedMovies(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  // Find the movies library
  const views = await getUserViews(serverUrl, userId, accessToken);
  const moviesLib =
    views.success && views.data.find((v: any) => v.CollectionType === "movies");
  if (!moviesLib) return { success: true, data: [] };
  return getLatestMedia(serverUrl, userId, accessToken, moviesLib.Id, 60);
}

export async function fetchRecentlyAddedShows(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  const views = await getUserViews(serverUrl, userId, accessToken);
  const showsLib =
    views.success &&
    views.data.find((v: any) => v.CollectionType === "tvshows");
  if (!showsLib) return { success: true, data: [] };
  return getLatestMedia(serverUrl, userId, accessToken, showsLib.Id, 60);
}

export async function fetchRecentlyAddedMusic(
  serverUrl: string,
  userId: string,
  accessToken: string,
) {
  const views = await getUserViews(serverUrl, userId, accessToken);
  const musicLib =
    views.success && views.data.find((v: any) => v.CollectionType === "music");
  if (!musicLib) return { success: true, data: [] };
  return getLatestMedia(serverUrl, userId, accessToken, musicLib.Id, 60);
}
