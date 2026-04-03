import { createJellyfinClient, getProxiedURL } from "@/lib/jellyfin/client";
import { useQuery } from "@tanstack/react-query";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export const searchItems = async (
  baseURL: string,
  userId: string,
  accessToken: string,
  searchTerm: string,
): Promise<{
  success: boolean;
  data: {
    movies: BaseItemDto[];
    shows: BaseItemDto[];
    music: BaseItemDto[];
  };
  error?: string;
}> => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    // Search across all items without library restriction
    const allItemsResponse = await client.itemsApi.getItems({
      userId,
      searchTerm,
      recursive: true,
      includeItemTypes: ["Movie", "Series", "Audio", "MusicAlbum"],
      fields: ["PrimaryImageAspectRatio", "ParentId"],
      sortBy: ["SortName"],
      sortOrder: ["Ascending"],
      limit: 100,
    });

    const allItems = allItemsResponse.data.Items || [];

    // Separate results by type
    const movies = allItems.filter((item) => item.Type === "Movie");
    const shows = allItems.filter((item) => item.Type === "Series");
    const music = allItems.filter(
      (item) => item.Type === "Audio" || item.Type === "MusicAlbum",
    );

    console.log("Search results:", {
      total: allItems.length,
      movies: movies.length,
      shows: shows.length,
      music: music.length,
    });

    return {
      success: true,
      data: {
        movies: movies.slice(0, 30),
        shows: shows.slice(0, 30),
        music: music.slice(0, 30),
      },
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to search items";
    return {
      success: false,
      data: {
        movies: [],
        shows: [],
        music: [],
      },
      error: errorMessage,
    };
  }
};

// TanStack Query hook for searching items
export function useSearchItemsQuery(
  baseURL: string,
  userId: string,
  accessToken: string,
  searchTerm: string,
) {
  return useQuery({
    queryKey: ["searchItems", baseURL, userId, accessToken, searchTerm],
    queryFn: () =>
      searchItems(baseURL, userId, accessToken, searchTerm).then((res) => {
        if (!res.success)
          throw new Error(res.error || "Failed to search items");
        return res.data;
      }),
    enabled: !!baseURL && !!userId && !!accessToken && !!searchTerm,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });
}
