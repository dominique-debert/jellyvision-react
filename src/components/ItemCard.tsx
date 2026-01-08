import { useNavigate } from "react-router-dom";
import { getImageUrl } from "@/lib/jellyfin/client";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface ItemCardProps {
  item: BaseItemDto;
  serverUrl: string;
}

export function ItemCard({ item, serverUrl }: ItemCardProps) {
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

  const primaryImageUrl = getPrimaryImageUrl();

  return (
    <div
      className="cursor-pointer group"
      onClick={() => navigate(`/item/${item.Id}`)}
    >
      <div className="relative aspect-2/3 bg-zinc-800 rounded-lg overflow-hidden mb-2">
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
      <h3 className="font-medium text-sm truncate">{item.Name}</h3>
      <p className="text-xs text-zinc-400 truncate">{getSubtitle()}</p>
    </div>
  );
}
