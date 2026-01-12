import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

// readonly Primary: "Primary";
// readonly Art: "Art";
// readonly Backdrop: "Backdrop";
// readonly Banner: "Banner";
// readonly Logo: "Logo";
// readonly Thumb: "Thumb";
// readonly Disc: "Disc";
// readonly Box: "Box";
// readonly Screenshot: "Screenshot";
// readonly Menu: "Menu";
// readonly Chapter: "Chapter";
// readonly BoxRear: "BoxRear";
// readonly Profile: "Profile";

export const getPrimaryImageUrl = (
  serverUrl: string | null,
  item: BaseItemDto | null,
  aspectRatio: "square" | "2/3" | "3/2"
) => {
  if (!serverUrl || !item?.Id) return undefined;

  // For episodes, use the season poster instead of episode thumbnail
  if (item.Type === "Episode" && item.SeasonId) {
    let width = 400,
      height = 600;
    if (aspectRatio === "square") {
      width = 600;
      height = 600;
    } else if (aspectRatio === "3/2") {
      width = 600;
      height = 400;
    }
    return getImageUrl(serverUrl, item.SeasonId, "Primary", width, height, 100);
  }

  if (item.ImageTags?.Primary) {
    // Request correct thumbnail size for aspect ratio
    let width = 400,
      height = 600;
    if (aspectRatio === "square") {
      width = 600;
      height = 600;
    } else if (aspectRatio === "3/2") {
      width = 600;
      height = 400;
    }
    return getImageUrl(serverUrl, item.Id, "Primary", width, height, 100);
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
