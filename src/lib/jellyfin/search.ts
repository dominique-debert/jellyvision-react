import { createJellyfinClient } from "@jellyfin/sdk";
import { getProxiedURL } from "./client";
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
    // Search for movies
    const moviesResponse = await client.itemsApi.getItems({
      userId,
      searchTerm,
      includeItemTypes: ["Movie"],
      sortBy: ["SortName"],
      sortOrder: ["Ascending"],
      limit: 30,
    });

    // Search for TV shows
    const showsResponse = await client.itemsApi.getItems({
      userId,
      searchTerm,
      includeItemTypes: ["Series"],
      sortBy: ["SortName"],
      sortOrder: ["Ascending"],
      limit: 30,
    });

    // Search for music
    const musicResponse = await client.itemsApi.getItems({
      userId,
      searchTerm,
      includeItemTypes: ["Audio", "MusicAlbum"],
      sortBy: ["SortName"],
      sortOrder: ["Ascending"],
      limit: 30,
    });

    return {
      success: true,
      data: {
        movies: moviesResponse.data.Items || [],
        shows: showsResponse.data.Items || [],
        music: musicResponse.data.Items || [],
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
