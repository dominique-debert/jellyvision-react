import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  serverUrl: string | null;
  accessToken: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  setAuth: (
    server: string,
    token: string,
    userId: string,
    username: string
  ) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      serverUrl: null,
      accessToken: null,
      userId: null,
      username: null,
      isAuthenticated: false,
      setAuth: (serverUrl, accessToken, userId, username) =>
        set({
          serverUrl,
          accessToken,
          userId,
          username,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          serverUrl: null,
          accessToken: null,
          userId: null,
          username: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "jellyfin-auth",
    }
  )
);
