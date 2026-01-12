import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { getItem, getImageUrl } from "@/lib/jellyfin/client";
// import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  LoadingState,
  NotFoundState,
  getPrimaryImageUrl,
  ItemHeader,
  MetadataTable,
  QualityBadges,
  SynopsisSection,
  CastAndCrewSection,
  SubtitleSelector,
} from "./shared";

export default function MovieDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState<
    number | undefined
  >();

  useEffect(() => {
    const fetchItem = async () => {
      if (!serverUrl || !userId || !accessToken || !itemId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await getItem(serverUrl, userId, itemId, accessToken);

      if (result.success && result.data) {
        setItem(result.data);
        const subtitleStreams =
          result.data.MediaStreams?.filter(
            (s) => s.Type === "Subtitle" && s.Index !== undefined
          ) || [];
        setSelectedSubtitle(subtitleStreams[0]?.Index);
      }

      setLoading(false);
    };

    fetchItem();
  }, [serverUrl, userId, accessToken, itemId]);

  const refetchItem = async () => {
    if (!serverUrl || !userId || !accessToken || !itemId) return;

    const result = await getItem(serverUrl, userId, itemId, accessToken);
    if (result.success && result.data) {
      setItem(result.data);
    }
  };

  if (loading) return <LoadingState />;
  if (!item) return <NotFoundState />;

  const primaryImageUrl = getPrimaryImageUrl(serverUrl, item, "3/2");
  const backdropUrl =
    item.Id && serverUrl
      ? getImageUrl(serverUrl, item.Id, "Backdrop", 1280, 720, 90)
      : undefined;

  return (
    <Layout backdropUrl={backdropUrl}>
      <div className="min-h-screen w-full">
        <div className="mx-auto pr-10 pl-15 py-2">
          <div className="flex">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-primary mb-6"
            >
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
    </Layout>
  );
}
