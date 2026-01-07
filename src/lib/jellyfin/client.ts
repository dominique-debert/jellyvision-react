import { Configuration, UserApi, SystemApi } from "@jellyfin/client-axios";
import axios from "axios";

// Generate a simple UUID v4
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Create authorization header for Jellyfin
const getAuthHeader = () => {
  const clientName = "Jellyfin React Client";
  const deviceName = "Web Browser";
  const deviceId = localStorage.getItem("deviceId") || generateUUID();
  const version = "1.0.0";

  // Store deviceId for future use
  localStorage.setItem("deviceId", deviceId);

  return `MediaBrowser Client="${clientName}", Device="${deviceName}", DeviceId="${deviceId}", Version="${version}"`;
};

const axiosInstance = axios.create({
  timeout: 10000,
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

  const config = new Configuration({
    basePath: proxiedURL,
    accessToken: accessToken,
  });

  return {
    user: new UserApi(config, proxiedURL, axiosInstance),
    system: new SystemApi(config, proxiedURL, axiosInstance),
    axios: axiosInstance,
    baseURL: proxiedURL,
  };
};

export const authenticateByName = async (
  baseURL: string,
  username: string,
  password: string
) => {
  const proxiedURL = getProxiedURL(baseURL);

  // Set auth header before making request
  axiosInstance.defaults.headers.common["X-Emby-Authorization"] =
    getAuthHeader();

  const client = createJellyfinClient({ baseURL: proxiedURL });

  try {
    const response = await client.user.authenticateUserByName({
      authenticateUserByName: {
        Username: username,
        Pw: password,
      },
    });

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
