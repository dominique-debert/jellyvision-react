import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Film, Bookmark, Check, Printer, MoreHorizontal } from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { markAsPlayed, markAsUnplayed } from "@/lib/jellyfin/client";
import { useAuthStore } from "@/store/useAuthStore";

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
  const [isTogglingWatched, setIsTogglingWatched] = useState(false);

  const handleWatchedToggle = async () => {
    if (!serverUrl || !userId || !accessToken || isTogglingWatched) return;

    setIsTogglingWatched(true);
    try {
      if (isWatched) {
        const result = await markAsUnplayed(
          serverUrl,
          userId,
          itemId,
          accessToken
        );
        if (result.success) {
          setIsWatched(false);
          if (onWatchedToggle) onWatchedToggle();
        }
      } else {
        const result = await markAsPlayed(
          serverUrl,
          userId,
          itemId,
          accessToken
        );
        if (result.success) {
          setIsWatched(true);
          if (onWatchedToggle) onWatchedToggle();
        }
      }
    } catch (error) {
      console.error("Failed to toggle watched status:", error);
    } finally {
      setIsTogglingWatched(false);
    }
  };

  return (
    <div className="flex items-start justify-between">
      <h1 className="text-5xl font-bold text-white/70">{item.Name}</h1>
      <div className="flex gap-3">
        <Button size="icon" variant="ghost" className="h-12 w-12 rounded-sm">
          <Film className="h-6 w-6" />
        </Button>
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
          <Printer className="h-6 w-6" />
        </Button>
        <Button size="icon" variant="ghost" className="h-12 w-12 rounded-sm">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
