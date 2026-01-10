import { useNavigate } from "react-router-dom";
import { getImageUrl } from "@/lib/jellyfin/client";
import { Play, CheckCircle } from "lucide-react";
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

    // For episodes, use the season poster instead of episode thumbnail
    if (item.Type === "Episode" && item.SeasonId) {
      const width = aspectRatio === "square" ? 600 : 400;
      const height = aspectRatio === "square" ? 600 : 600;
      return getImageUrl(
        serverUrl,
        item.SeasonId,
        "Primary",
        width,
        height,
        85
      );
    }

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
    <div className="group">
      <div
        className="relative cursor-pointer"
        onClick={onPlayClick ? handlePlayClick : handleCardClick}
      >
        <div
          className={`relative ${
            aspectRatio === "square" ? "aspect-square" : "aspect-2/3"
          } bg-base-300 rounded-md overflow-hidden`}
        >
          {primaryImageUrl ? (
            <img
              src={primaryImageUrl}
              alt={item.Name || "Item"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              No Image
            </div>
          )}
          {/* Watched indicator - only for non-music items */}
          {item.UserData?.Played &&
            item.Type !== "Audio" &&
            item.Type !== "MusicAlbum" &&
            item.Type !== "MusicArtist" && (
              <div className="absolute top-2 right-2 bg-green-500/90 rounded-full p-1 shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            )}
          {/* Hover overlay with play button only */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayClick(e);
              }}
              className="h-20 w-20 rounded-full hover:bg-white/30 hover:scale-110 flex items-center justify-center transition-all cursor-pointer shadow-2xl border-2 border-white/20"
            >
              <Play className="h-10 w-10 text-white/60 fill-white/60" />
            </button>
          </div>
          {/* Progress bar for resume items */}
          {item.UserData?.PlayedPercentage &&
            item.UserData.PlayedPercentage > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-2">
                <div
                  className="h-full"
                  style={{
                    width: `${item.UserData.PlayedPercentage}%`,
                    background:
                      "linear-gradient(to right, #a855f7, #3b82f6, #06b6d4)",
                  }}
                />
              </div>
            )}
        </div>
      </div>
      {/* Title and metadata below poster */}
      <div className="mt-2">
        <h3 className="font-medium text-md line-clamp-1">{item.Name}</h3>
        {item.Type === "Episode" ? (
          <p className="text-sm text-base-content/60 mt-0.5">
            Season {item.ParentIndexNumber} · Episode {item.IndexNumber}
          </p>
        ) : item.ProductionYear ? (
          <p className="text-sm text-base-content/60 mt-0.5">
            {item.ProductionYear}
          </p>
        ) : null}
      </div>
    </div>
  );
}
