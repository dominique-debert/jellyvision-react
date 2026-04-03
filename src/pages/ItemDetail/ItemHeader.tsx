import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Check, MoreHorizontal } from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { markAsPlayed, markAsUnplayed } from "@/lib/jellyfin/client";
import { useAuthStore } from "@/store/useAuthStore";
import { getLogoUrl } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export const ItemHeader = ({
  item,
  itemId,
  onWatchedToggle,
}: {
  item: BaseItemDto;
  itemId: string;
  onWatchedToggle?: () => void;
}) => {
  const { serverUrl, userId, accessToken } = useAuthStore();
  const [isWatched, setIsWatched] = useState(item.UserData?.Played || false);

  const { mutate: toggleWatched, isPending: isTogglingWatched } = useMutation({
    mutationFn: async () => {
      if (!serverUrl || !userId || !accessToken) return;
      if (isWatched) {
        const result = await markAsUnplayed(
          serverUrl,
          userId,
          itemId,
          accessToken,
        );
        if (result.success) setIsWatched(false);
        return result;
      } else {
        const result = await markAsPlayed(
          serverUrl,
          userId,
          itemId,
          accessToken,
        );
        if (result.success) setIsWatched(true);
        return result;
      }
    },
    onSuccess: () => {
      if (onWatchedToggle) onWatchedToggle();
    },
    onError: (error) => {
      console.error("Failed to toggle watched status:", error);
    },
  });

  const handleWatchedToggle = () => {
    toggleWatched();
  };

  const logoUrl = getLogoUrl(serverUrl, item, 400);

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={item.Name || "Title"}
            className="max-h-24 max-w-96 object-contain"
          />
        ) : (
          <h1 className="text-5xl text-left font-bold text-white/70">
            {item.Name}
          </h1>
        )}
      </div>
      <div className="flex gap-3 shrink-0">
        <Button size="icon" variant="ghost" className="h-12 w-12 rounded-sm">
          <Bookmark className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={`h-12 w-12 rounded-sm ${
            isWatched ? "bg-green-500/20 text-green-400" : ""
          }`}
          onClick={handleWatchedToggle}
          disabled={isTogglingWatched}
        >
          <Check className="h-6 w-6" />
        </Button>
        <Button size="icon" variant="ghost" className="h-12 w-12 rounded-sm">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
