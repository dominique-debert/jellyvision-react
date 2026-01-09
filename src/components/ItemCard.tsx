import { useNavigate } from "react-router-dom";
import { getImageUrl } from "@/lib/jellyfin/client";
import { Play } from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface ItemCardProps {
  item: BaseItemDto;
  serverUrl: string;
  onPlayClick?: (e: React.MouseEvent) => void;
  aspectRatio?: "square" | "2/3";
}

export function ItemCard({
  item,
  serverUrl,
  onPlayClick,
  aspectRatio = "2/3",
}: ItemCardProps) {
  const navigate = useNavigate();

  const getPrimaryImageUrl = () => {
    if (!serverUrl || !item?.Id) return undefined;
    if (item.ImageTags?.Primary) {
      // Request 400x600 thumbnail for 2/3 aspect ratio, 600x600 for square
      const width = aspectRatio === "square" ? 600 : 400;
      const height = aspectRatio === "square" ? 600 : 600;
      return getImageUrl(serverUrl, item.Id, "Primary", width, height, 85);
    }
    return undefined;
  };

  const getSubtitle = () => {
    if (item.Type === "Episode") {
      return `Season ${item.ParentIndexNumber} · Episode ${item.IndexNumber}`;
    }
    return item.ProductionYear?.toString() || "";
  };

  const getSeriesBadges = () => {
    return null;
  };

  const primaryImageUrl = getPrimaryImageUrl();

  const handleCardClick = () => {
    navigate(`/item/${item.Id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayClick) {
      onPlayClick(e);
    } else {
      navigate(`/play/${item.Id}`);
    }
  };

  return (
    <div
      className="cursor-pointer group"
      onClick={onPlayClick ? handlePlayClick : handleCardClick}
    >
      <div className="relative">
        <div
          className={`relative ${
            aspectRatio === "square" ? "aspect-square" : "aspect-2/3"
          } bg-base-300 rounded-lg overflow-hidden`}
        >
          {primaryImageUrl ? (
            <img
              src={primaryImageUrl}
              alt={item.Name || "Item"}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              No Image
            </div>
          )}
          {/* Hover overlay with play button centered and title at bottom */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between rounded-lg p-4">
            <div></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayClick(e);
              }}
              className="h-16 w-16 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-colors"
            >
              <Play className="h-8 w-8 text-primary-content fill-primary-content" />
            </button>
            <div className="w-full">
              <h3 className="font-semibold text-sm text-white text-center line-clamp-2">
                {item.Name}
              </h3>
              {item.Type === "Series" && item.ChildCount && (
                <p className="text-xs text-white/90 font-medium mt-1 text-center">
                  {item.ChildCount}{" "}
                  {item.ChildCount === 1 ? "Season" : "Seasons"}
                </p>
              )}
              {item.Type !== "Series" && getSubtitle() && (
                <p className="text-xs text-white/80 mt-1 text-center">
                  {getSubtitle()}
                </p>
              )}
            </div>
          </div>
          {/* Progress bar for resume items */}
          {item.UserData?.PlayedPercentage &&
            item.UserData.PlayedPercentage > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${item.UserData.PlayedPercentage}%` }}
                />
              </div>
            )}
        </div>
        {/* Series badges - positioned outside overflow container */}
        {getSeriesBadges()}
      </div>
    </div>
  );
}
