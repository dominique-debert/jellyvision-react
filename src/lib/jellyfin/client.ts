import { Jellyfin } from "@jellyfin/sdk";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getImageApi } from "@jellyfin/sdk/lib/utils/api/image-api";

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
