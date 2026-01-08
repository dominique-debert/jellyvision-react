export const getAllAlbumsInLibrary = async (
  baseURL: string,
  userId: string,
  libraryId: string,
  accessToken: string,
  startIndex: number = 0,
  limit: number = 60
): Promise<{
  success: boolean;
  data: BaseItemDto[];
  totalCount: number;
  error?: string;
}> => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    const response = await client.itemsApi.getItems({
      userId,
      parentId: libraryId,
      includeItemTypes: ["MusicAlbum"],
      recursive: true,
      sortBy: ["SortName"],
      sortOrder: ["Ascending"],
      startIndex,
      limit,
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch albums");
    }

    return {
      success: true,
      data: response.data.Items || [],
      totalCount: response.data.TotalRecordCount || 0,
    };
  } catch (error: any) {
    console.error("Get all albums error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch albums",
      data: [],
      totalCount: 0,
    };
  }
};
export const getAlbumTracks = async (
  baseURL: string,
  userId: string,
  albumId: string,
  accessToken: string
): Promise<{
  success: boolean;
  data: BaseItemDto[];
  error?: string;
}> => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    const response = await client.itemsApi.getItems({
      userId,
      parentId: albumId,
      includeItemTypes: ["Audio"],
      sortBy: ["ParentIndexNumber", "IndexNumber"],
      sortOrder: ["Ascending"],
      recursive: false,
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch album tracks");
    }

    return {
      success: true,
      data: response.data.Items || [],
    };
  } catch (error: any) {
    console.error("Get album tracks error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch album tracks",
      data: [],
    };
  }
};
import { Jellyfin } from "@jellyfin/sdk";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getImageApi } from "@jellyfin/sdk/lib/utils/api/image-api";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

// Generate a simple UUID v4
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get or create device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

// Initialize the Jellyfin SDK
const jellyfin = new Jellyfin({
  clientInfo: {
    name: "Jellyfin React Client",
    version: "1.0.0",
  },
  deviceInfo: {
    name: "Web Browser",
    id: getDeviceId(),
  },
});

export interface JellyfinClientConfig {
  baseURL: string;
  accessToken?: string;
}

// Helper to determine if we should use proxy
const getProxiedURL = (baseURL: string) => {
  // In dev mode, always use proxy for network addresses
  if (import.meta.env.DEV && baseURL.includes("192.168.1.100")) {
    return "/jellyfin";
  }
  return baseURL;
};

export const createJellyfinClient = ({
  baseURL,
  accessToken,
}: JellyfinClientConfig) => {
  const proxiedURL = getProxiedURL(baseURL);

  const api = jellyfin.createApi(proxiedURL, accessToken);

  return {
    api,
    systemApi: getSystemApi(api),
    userApi: getUserApi(api),
    imageApi: getImageApi(api),
    userViewsApi: getUserViewsApi(api),
    itemsApi: getItemsApi(api),
    userLibraryApi: getUserLibraryApi(api),
    tvShowsApi: getTvShowsApi(api),
    baseURL: proxiedURL,
    jellyfin,
  };
};

export const authenticateByName = async (
  baseURL: string,
  username: string,
  password: string
) => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL });

  try {
    const response = await client.userApi.authenticateUserByName({
      authenticateUserByName: {
        Username: username,
        Pw: password,
      },
    });

    if (response.status !== 200 || !response.data) {
      throw new Error("Authentication failed");
    }

    return {
      success: true,
      data: response.data,
      serverUrl: proxiedURL === "/jellyfin" ? baseURL : proxiedURL,
    };
  } catch (error: any) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Authentication failed",
    };
  }
};

export const getUserById = async (
  baseURL: string,
  userId: string,
  accessToken: string
) => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    const response = await client.userApi.getUserById({ userId });

    if (response.status !== 200 || !response.data) {
      throw new Error("Failed to fetch user");
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Get user error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch user",
    };
  }
};

export const getUserImageUrl = (
  baseURL: string,
  user: { Id?: string; PrimaryImageTag?: string | null },
  accessToken?: string
) => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  return client.imageApi.getUserImageUrl(user as any);
};

export const getImageUrl = (
  baseURL: string,
  itemId: string,
  imageType: string = "Primary"
) => {
  const proxiedURL = getProxiedURL(baseURL);
  return `${proxiedURL}/Items/${itemId}/Images/${imageType}`;
};

export const getUserViews = async (
  baseURL: string,
  userId: string,
  accessToken: string
) => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    const response = await client.userViewsApi.getUserViews({ userId });

    if (response.status !== 200 || !response.data) {
      throw new Error("Failed to fetch user views");
    }

    return {
      success: true,
      data: response.data.Items || [],
    };
  } catch (error: any) {
    console.error("Get user views error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch user views",
      data: [],
    };
  }
};

export const getLibraryItems = async (
  baseURL: string,
  userId: string,
  parentId: string,
  accessToken: string,
  startIndex: number = 0,
  limit: number = 50
): Promise<{
  success: boolean;
  data: BaseItemDto[];
  totalCount: number;
  error?: string;
}> => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    const response = await client.itemsApi.getItems({
      userId,
      parentId,
      sortBy: ["SortName"],
      sortOrder: ["Ascending"],
      recursive: true,
      startIndex,
      limit,
    });

    if (response.status !== 200 || !response.data) {
      throw new Error("Failed to fetch library items");
    }

    return {
      success: true,
      data: response.data.Items || [],
      totalCount: response.data.TotalRecordCount || 0,
    };
  } catch (error: any) {
    console.error("Get library items error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch library items",
      data: [],
      totalCount: 0,
    };
  }
};

export const getItem = async (
  baseURL: string,
  userId: string,
  itemId: string,
  accessToken: string
): Promise<{
  success: boolean;
  data: BaseItemDto | null;
  error?: string;
}> => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    const response = await client.userLibraryApi.getItem({
      userId,
      itemId,
    });

    if (response.status !== 200 || !response.data) {
      throw new Error("Failed to fetch item");
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Get item error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch item",
      data: null,
    };
  }
};

export const getSeasons = async (
  baseURL: string,
  userId: string,
  seriesId: string,
  accessToken: string
): Promise<{
  success: boolean;
  data: BaseItemDto[];
  error?: string;
}> => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    const response = await client.tvShowsApi.getSeasons({
      userId,
      seriesId,
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch seasons");
    }

    return {
      success: true,
      data: response.data.Items || [],
    };
  } catch (error: any) {
    console.error("Get seasons error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch seasons",
      data: [],
    };
  }
};

export const getEpisodes = async (
  baseURL: string,
  userId: string,
  seasonId: string,
  accessToken: string
): Promise<{
  success: boolean;
  data: BaseItemDto[];
  error?: string;
}> => {
  const proxiedURL = getProxiedURL(baseURL);
  const client = createJellyfinClient({ baseURL: proxiedURL, accessToken });

  try {
    const response = await client.itemsApi.getItems({
      userId,
      parentId: seasonId,
      fields: ["Overview"],
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch episodes");
    }

    return {
      success: true,
      data: response.data.Items || [],
    };
  } catch (error: any) {
    console.error("Get episodes error:", error);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch episodes",
      data: [],
    };
  }
};
