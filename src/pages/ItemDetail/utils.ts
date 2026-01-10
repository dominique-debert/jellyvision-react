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
  maxWidth?: number,
  maxHeight?: number
) => {
  if (!serverUrl || !item?.Id) return undefined;
  if (item.ImageTags?.Primary) {
    return getImageUrl(serverUrl, item.Id, "Primary", maxWidth, maxHeight, 90);
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
