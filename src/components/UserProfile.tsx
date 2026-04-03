import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getUserById, getUserImageUrl } from "@/lib/jellyfin/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogOut, User as UserIcon } from "lucide-react";

export function UserProfile() {
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId, username, logout } = useAuthStore();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["userProfile", serverUrl, userId, accessToken],
    queryFn: async () => {
      if (!serverUrl || !userId || !accessToken) return null;
      const result = await getUserById(serverUrl, userId, accessToken);
      if (result.success && result.data) return result.data;
      return null;
    },
    enabled: !!serverUrl && !!userId && !!accessToken,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const avatarUrl =
    userId && serverUrl && userData
      ? getUserImageUrl(
          serverUrl,
          { Id: userId, PrimaryImageTag: userData.PrimaryImageTag },
          accessToken || undefined,
        )
      : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Welcome back!</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username || "User"}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget
                    .nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              style={{ display: avatarUrl ? "none" : "flex" }}
            >
              <UserIcon className="size-8 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">
              {userData?.Name || username}
            </h3>
            {userData?.LastLoginDate && (
              <p className="text-sm text-muted-foreground">
                Last login:{" "}
                {new Date(userData.LastLoginDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
