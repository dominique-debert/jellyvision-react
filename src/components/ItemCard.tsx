import { useNavigate } from "react-router-dom";
import { getImageUrl } from "@/lib/jellyfin/client";
import { Play } from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface ItemCardProps {
  item: BaseItemDto;
  serverUrl: string;
  onPlayClick?: (e: React.MouseEvent) => void;
}

export function ItemCard({ item, serverUrl, onPlayClick }: ItemCardProps) {
  const navigate = useNavigate();

  const getPrimaryImageUrl = () => {
    if (!serverUrl || !item?.Id) return undefined;
    if (item.ImageTags?.Primary) {
      return getImageUrl(serverUrl, item.Id, "Primary");
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
      <div className="relative mb-2">
        <div className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden">
          {primaryImageUrl ? (
            <img
              src={primaryImageUrl}
              alt={item.Name || "Item"}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              No Image
            </div>
          )}
          {/* Play icon overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
            <Play className="h-12 w-12 text-white fill-white" />
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
      <h3 className="font-medium text-sm truncate">{item.Name}</h3>
      {item.Type === "Series" && item.ChildCount && (
        <p className="text-xs text-amber-500 font-medium">
          {item.ChildCount} {item.ChildCount === 1 ? "Season" : "Seasons"}
        </p>
      )}
      {item.Type !== "Series" && (
        <p className="text-xs text-zinc-400 truncate">{getSubtitle()}</p>
      )}
    </div>
  );
}
