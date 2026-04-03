import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { getItem } from "@/lib/jellyfin/client";
import { ArrowLeft, Play } from "lucide-react";
import {
  LoadingState,
  NotFoundState,
  ItemHeader,
  MetadataTable,
  QualityBadges,
  SynopsisSection,
  CastAndCrewSection,
  SubtitleSelector,
} from "@/pages/ItemDetail/shared";
import { getPrimaryImageUrl } from "@/lib/utils";
import { useEffect } from "react";

export default function MovieDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [selectedSubtitle, setSelectedSubtitle] = useState<
    number | undefined
  >();

  const {
    data: item,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["movieDetail", serverUrl, userId, accessToken, itemId],
    queryFn: async () => {
      if (!serverUrl || !userId || !accessToken || !itemId) return null;
      const result = await getItem(serverUrl, userId, itemId, accessToken);
      if (result.success && result.data) return result.data;
      throw new Error("Not found");
    },
    enabled: !!serverUrl && !!userId && !!accessToken && !!itemId,
  });

  // Set selected subtitle when item is loaded
  useEffect(() => {
    if (item?.MediaStreams) {
      const subtitleStreams =
        item.MediaStreams.filter(
          (s) => s.Type === "Subtitle" && s.Index !== undefined,
        ) || [];
      const firstSubtitleIndex = subtitleStreams[0]?.Index;
      if (
        firstSubtitleIndex !== undefined &&
        selectedSubtitle !== firstSubtitleIndex
      ) {
        setSelectedSubtitle(firstSubtitleIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const refetchItem = async () => {
    await refetch();
  };

  if (isLoading) return <LoadingState />;
  if (isError || !item) return <NotFoundState />;

  const primaryImageUrl = getPrimaryImageUrl(serverUrl, item, "3/2");

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto pr-10 pl-15 py-2">
        <div className="flex">
          <button onClick={() => navigate(-1)} className="btn btn-primary mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
        </div>

        <div className="flex gap-8">
          {/* Left Column - Poster */}
          <div className="w-80 shrink-0">
            <div className="relative group rounded-lg overflow-hidden border border-primary/20 shadow-lg">
              {primaryImageUrl ? (
                <img
                  src={primaryImageUrl}
                  alt={item.Name || "Movie"}
                  className="w-full rounded-lg shadow-2xl"
                />
              ) : (
                <div className="w-full aspect-2/3 bg-base-300 rounded-lg flex items-center justify-center">
                  <span className="text-zinc-600">No Image</span>
                </div>
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <button
                  className="h-20 w-20 rounded-full hover:bg-white/30 hover:scale-110 flex items-center justify-center transition-all cursor-pointer shadow-2xl border-2 border-white/20"
                  onClick={() => navigate(`/play/${itemId}`)}
                >
                  <Play className="h-10 w-10 text-white/60 fill-white/60" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="flex-1 min-w-0 space-y-6">
            <ItemHeader
              item={item}
              itemId={itemId!}
              onWatchedToggle={refetchItem}
            />

            <SubtitleSelector
              item={item}
              selectedSubtitle={selectedSubtitle}
              onSubtitleChange={setSelectedSubtitle}
            />

            <QualityBadges item={item} />

            <MetadataTable item={item} />

            <SynopsisSection item={item} />

            <CastAndCrewSection item={item} serverUrl={serverUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
