import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Film,
  Bookmark,
  Check,
  Printer,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  getImageUrl,
  markAsPlayed,
  markAsUnplayed,
} from "@/lib/jellyfin/client";
import { useAuthStore } from "@/store/useAuthStore";

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

export const LoadingState = () => (
  <Layout>
    <div className="container mx-auto p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 bg-base-300 rounded" />
        <div className="h-96 bg-base-300 rounded" />
      </div>
    </div>
  </Layout>
);

export const NotFoundState = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-zinc-400">Item not found</p>
      </div>
    </Layout>
  );
};

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

export const MetadataTable = ({ item }: { item: BaseItemDto }) => (
  <div className="grid grid-cols-4 gap-6 text-sm">
    <div className="flex flex-col items-start">
      <div className="text-white/70 font-medium mb-1">Date</div>
      <div className="text-white">
        {item.ProductionYear || item.PremiereDate
          ? new Date(
              item.PremiereDate || `${item.ProductionYear}-01-01`
            ).getFullYear()
          : "-"}
      </div>
    </div>
    <div className="flex flex-col items-start">
      <div className="text-white/70 font-medium mb-1">Duration</div>
      <div className="text-white">
        {item.RunTimeTicks ? formatRuntime(item.RunTimeTicks) : "-"}
      </div>
    </div>
    <div className="flex flex-col items-start">
      <div className="text-white/70 font-medium mb-1">Certification</div>
      <div className="text-white">{item.OfficialRating || "-"}</div>
    </div>
    <div className="flex flex-col items-start">
      <div className="text-white/70 font-medium mb-1">Genre</div>
      <div className="text-white">{item.Genres?.join(", ") || "-"}</div>
    </div>
  </div>
);

export const QualityBadges = ({ item }: { item: BaseItemDto }) => {
  const has4K = item.MediaStreams?.some(
    (s) => s.Type === "Video" && s.Width && s.Width >= 3800
  );
  const hasHDR = item.MediaStreams?.some(
    (s) => s.Type === "Video" && s.VideoRangeType && s.VideoRangeType !== "SDR"
  );

  return (
    <div className="flex gap-2">
      {has4K && (
        <Badge className="bg-base-300 hover:bg-base-content/20 text-base-content font-bold px-3 py-1">
          4K
        </Badge>
      )}
      {hasHDR && (
        <Badge className="bg-base-300 hover:bg-base-content/20 text-base-content font-bold px-3 py-1">
          HDR
        </Badge>
      )}
    </div>
  );
};

export const SynopsisSection = ({ item }: { item: BaseItemDto }) => {
  if (!item.Overview) return null;
  return (
    <div className="flex flex-col items-start">
      <h2 className="text-white/70 font-medium mb-2">Synopsis</h2>
      <p className="text-zinc-300 font-light text-justify p-0 m-0 leading-relaxed">
        {item.Overview}
      </p>
    </div>
  );
};

export const CastAndCrewSection = ({
  item,
  serverUrl,
}: {
  item: BaseItemDto;
  serverUrl: string | null;
}) => {
  const directors = item.People?.filter((p) => p.Type === "Director") || [];
  const writers = item.People?.filter((p) => p.Type === "Writer") || [];
  const actors = item.People?.filter((p) => p.Type === "Actor") || [];

  return (
    <div>
      <div className="flex items-start gap-8">
        {/* Left: Crew List (Vertical) */}
        <div className="w-56 shrink-0 space-y-6">
          {/* Directors */}
          <div className="flex flex-col items-start space-y-1">
            <h3 className="text-white/70 font-medium mb-3">Directors</h3>
            {directors.length > 0 ? (
              <div className="space-y-1">
                {directors.map((director) => (
                  <div key={director.Id} className="text-white text-sm">
                    {director.Name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">No directors found</div>
            )}
          </div>

          {/* Screenwriters */}
          <div className="flex flex-col items-start space-y-1">
            <h3 className="text-white/70 font-medium mb-3">Screenwriters</h3>
            {writers.length > 0 ? (
              <div className="space-y-1">
                {writers.map((writer) => (
                  <div key={writer.Id} className="text-white text-sm">
                    {writer.Name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">
                No screenwriters found
              </div>
            )}
          </div>
        </div>

        {/* Right: Actors (Grid) */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white/70 font-medium mb-4 text-left">Actors</h3>
          {actors.filter((a) => a.PrimaryImageTag).length > 0 ? (
            <div className="grid grid-cols-2 items-start md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {actors
                .filter(
                  (actor) => actor.PrimaryImageTag && serverUrl && actor.Id
                )
                .slice(0, 10)
                .map((actor) => (
                  <div key={actor.Id} className="flex flex-col items-start">
                    <img
                      src={getImageUrl(
                        serverUrl!,
                        actor.Id!,
                        "Primary",
                        160,
                        160,
                        85
                      )}
                      alt={actor.Name || "Actor"}
                      className="w-20 h-20 rounded-full object-cover mb-2"
                      loading="lazy"
                    />
                    <p className="text-white text-xs font-medium text-center line-clamp-2">
                      {actor.Name}
                    </p>
                    {actor.Role && (
                      <p className="text-zinc-400 text-xs text-center line-clamp-1">
                        as {actor.Role}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">
              No actors with images found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SubtitleSelector = ({
  item,
  selectedSubtitle,
  onSubtitleChange,
}: {
  item: BaseItemDto;
  selectedSubtitle: number | undefined;
  onSubtitleChange: (subtitle: number | undefined) => void;
}) => {
  const subtitleStreams =
    item?.MediaStreams?.filter(
      (s) => s.Type === "Subtitle" && s.Index !== undefined
    ) || [];

  if (subtitleStreams.length === 0) return null;

  return (
    <div className="flex items-center gap-3 text-sm text-white">
      <span className="text-white/70 font-medium">Subtitles:</span>
      <select
        value={selectedSubtitle ?? "none"}
        onChange={(e) =>
          onSubtitleChange(
            e.target.value === "none" ? undefined : Number(e.target.value)
          )
        }
        className="bg-base-200 border border-base-300 rounded px-3 py-2 text-base-content text-sm"
      >
        <option value="none">None</option>
        {subtitleStreams.map((s) => (
          <option key={s.Index} value={s.Index}>
            {s.Language || s.DisplayTitle || `Subtitle ${s.Index}`}
            {s.IsForced ? " (Forced)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
};
