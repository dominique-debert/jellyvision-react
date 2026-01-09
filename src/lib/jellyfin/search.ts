import { createJellyfinClient, getProxiedURL } from "./client";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export const searchItems = async (
  baseURL: string,
  userId: string,
  accessToken: string,
  searchTerm: string
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
      fields: [
        "PrimaryImageAspectRatio",
        "ProductionYear",
        "ParentId",
        "UserData",
      ],
      sortBy: ["SortName"],
      sortOrder: ["Ascending"],
      limit: 100,
    });

    const allItems = allItemsResponse.data.Items || [];

    // Separate results by type
    const movies = allItems.filter((item) => item.Type === "Movie");
    const shows = allItems.filter((item) => item.Type === "Series");
    const music = allItems.filter(
      (item) => item.Type === "Audio" || item.Type === "MusicAlbum"
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
