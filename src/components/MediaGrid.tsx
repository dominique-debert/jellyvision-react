import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Play, CircleCheck } from "lucide-react";
import { getImageUrl } from "@/lib/jellyfin/client";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface MediaGridProps {
  items: BaseItemDto[];
  loading?: boolean;
  libraryType?: string | null;
}

export function MediaGrid({ items, loading, libraryType }: MediaGridProps) {
  const navigate = useNavigate();
  if (loading) return <div>Loading...</div>;
  if (!items.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          No items found
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10 pb-30">
      {items.map((item) => (
        <div
          key={item.Id}
          className="cursor-pointer group"
          onClick={() => navigate(`/item/${item.Id}`)}
        >
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <div
              className={`$ {
                libraryType === "music" ? "aspect-square" : "aspect-2/3"
              } bg-muted overflow-hidden`}
            >
              {item.Id && item.ImageTags?.["Primary"] ? (
                <img
                  src={getImageUrl("", item.Id, "Primary", 400, 600, 85)}
                  alt={item.Name || "Media item"}
                  className="w-full h-full rounded-xl border border-white/10 object-cover transition-transform group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {item.Type === "Movie"
                    ? "🎬"
                    : item.Type === "Series"
                    ? "📺"
                    : item.Type === "Audio"
                    ? "🎵"
                    : "📁"}
                </div>
              )}
              {item.UserData?.Played && libraryType !== "music" && (
                <div className="absolute top-2 right-2 rounded-full p-1 shadow-lg">
                  <CircleCheck className="size-6  text-green-700/90" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between rounded-lg p-4">
                <div></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (libraryType === "music") {
                      navigate(`/item/${item.Id}?autoplay=true`);
                    } else {
                      navigate(`/play/${item.Id}`);
                    }
                  }}
                  className="h-20 w-20 rounded-full hover:bg-white/30 hover:scale-110 flex items-center justify-center transition-all cursor-pointer shadow-2xl border-2 border-white/20"
                >
                  <Play className="h-10 w-10 text-white/60 fill-white/60" />
                </button>
                <div className="w-full">
                  <h3 className="font-semibold text-lg text-white text-center line-clamp-2">
                    {item.Name}
                  </h3>
                  {item.Type === "Series" && item.ChildCount && (
                    <p className="text-xs text-white/90 font-medium mt-1 text-center">
                      {item.ChildCount}{" "}
                      {item.ChildCount === 1 ? "Season" : "Seasons"}
                    </p>
                  )}
                  {item.ProductionYear && (
                    <p className="text-lg text-white/80 mt-1 text-center">
                      {item.ProductionYear}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
