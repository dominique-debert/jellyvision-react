import { getImageUrl } from "@/lib/jellyfin/client";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export const formatRuntime = (ticks?: number) => {
  if (!ticks) return null;
  const minutes = Math.floor(ticks / 600000000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};

export const getPrimaryImageUrl = (
  serverUrl: string | null,
  item: BaseItemDto | null,
  aspectRatio: "square" | "2/3" = "2/3"
) => {
  if (!serverUrl || !item?.Id) return undefined;

  // For episodes, use the season poster instead of episode thumbnail
  if (item.Type === "Episode" && item.SeasonId) {
    const width = aspectRatio === "square" ? 600 : 400;
    const height = aspectRatio === "square" ? 600 : 600;
    return getImageUrl(serverUrl, item.SeasonId, "Primary", width, height, 85);
  }

  if (item.ImageTags?.Primary) {
    // Request 400x600 thumbnail for 2/3 aspect ratio, 600x600 for square
    const width = aspectRatio === "square" ? 600 : 400;
    const height = aspectRatio === "square" ? 600 : 600;
    return getImageUrl(serverUrl, item.Id, "Primary", width, height, 85);
  }
  return undefined;
};

export const getLogoUrl = (
  serverUrl: string | null,
  item: BaseItemDto | null,
  maxWidth?: number,
  maxHeight?: number
) => {
  if (!serverUrl || !item?.Id) return undefined;
  if (item.ImageTags?.Logo) {
    return getImageUrl(serverUrl, item.Id, "Logo", maxWidth, maxHeight, 90);
  }
  return undefined;
};
