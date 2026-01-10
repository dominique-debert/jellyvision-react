import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { getItem, getImageUrl } from "@/lib/jellyfin/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

  if (loading) return <LoadingState />;
  if (!item) return <NotFoundState />;

  const primaryImageUrl = getPrimaryImageUrl(serverUrl, item);
  const backdropUrl =
    item.Id && serverUrl
      ? getImageUrl(serverUrl, item.Id, "Backdrop", 1280, 720, 90)
      : undefined;

  return (
    <Layout backdropUrl={backdropUrl}>
      <div className="min-h-screen w-full">
        <div className="mx-auto px-10 pl-20 py-8">
          <div className="flex">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="flex gap-8">
            {/* Left Column - Poster */}
            <div className="w-80 shrink-0">
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
            </div>

            {/* Right Column - Details */}
            <div className="flex-1 min-w-0 space-y-6">
              <ItemHeader item={item} itemId={itemId!} />

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
