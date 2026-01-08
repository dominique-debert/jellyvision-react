import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { getItem, getAlbumTracks } from "@/lib/jellyfin/client";
import { Button } from "@/components/ui/button";
import { Disc, Play, ArrowLeft } from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import {
  LoadingState,
  NotFoundState,
  getPrimaryImageUrl,
  ItemHeader,
  MetadataTable,
  QualityBadges,
  SynopsisSection,
} from "./shared";

function formatTrackTime(ticks?: number | null) {
  if (!ticks) return "";
  const totalSeconds = Math.floor(ticks / 10000000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MusicDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [albumTracks, setAlbumTracks] = useState<BaseItemDto[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

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
      }

      setLoading(false);
    };

    fetchItem();
  }, [serverUrl, userId, accessToken, itemId]);

  useEffect(() => {
    let cancelled = false;
    if (!serverUrl || !userId || !accessToken || !itemId || !item) return;
    if (item.Type !== "MusicAlbum") return;

    const loadTracks = async () => {
      setLoadingTracks(true);
      const result = await getAlbumTracks(
        serverUrl,
        userId,
        itemId,
        accessToken
      );
      if (cancelled) return;
      if (result.success && result.data) {
        setAlbumTracks(result.data);
      } else {
        setAlbumTracks([]);
      }
      setLoadingTracks(false);
    };

    loadTracks();
    return () => {
      cancelled = true;
    };
  }, [serverUrl, userId, accessToken, itemId, item]);

  if (loading) return <LoadingState />;
  if (!item) return <NotFoundState />;

  // Group tracks by disc number
  const tracksPerDisc: Record<number, BaseItemDto[]> = {};
  if (item.Type === "MusicAlbum" && albumTracks.length > 0) {
    for (const track of albumTracks) {
      const disc = track.ParentIndexNumber ?? 1;
      if (!tracksPerDisc[disc]) tracksPerDisc[disc] = [];
      tracksPerDisc[disc].push(track);
    }
  }

  const primaryImageUrl = getPrimaryImageUrl(serverUrl, item);

  return (
    <Layout>
      <div className="min-h-screen bg-linear-to-br from-gray-900 to-black">
        <div className="container mx-auto px-8 py-8 max-w-400">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-8">
            {/* Left Column - Album Art */}
            <div className="w-80 shrink-0">
              {primaryImageUrl ? (
                <img
                  src={primaryImageUrl}
                  alt={item.Name || "Album"}
                  className="w-full rounded-lg shadow-2xl"
                />
              ) : (
                <div className="w-full aspect-2/3 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <span className="text-zinc-600">No Image</span>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="flex-1 min-w-0 space-y-6">
              <ItemHeader item={item} itemId={itemId!} />

              <QualityBadges item={item} />

              <MetadataTable item={item} />

              <SynopsisSection item={item} />

              {/* Album Info */}
              <div className="space-y-2">
                {item.AlbumArtist && (
                  <div>
                    <span className="text-zinc-400">Artist: </span>
                    <span>{item.AlbumArtist}</span>
                  </div>
                )}
                {item.ProductionYear && (
                  <div>
                    <span className="text-zinc-400">Released: </span>
                    <span>{item.ProductionYear}</span>
                  </div>
                )}
              </div>

              {/* Tracks */}
              <div className="mt-6">
                <h3 className="text-2xl font-semibold mb-4">Tracks</h3>
                {loadingTracks ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 w-full bg-zinc-800 rounded" />
                    <div className="h-32 w-full bg-zinc-800 rounded" />
                  </div>
                ) : albumTracks.length === 0 ? (
                  <div className="text-zinc-400">No tracks found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    {Object.keys(tracksPerDisc).map((discNum) => (
                      <div key={discNum} className="mb-6">
                        {Object.keys(tracksPerDisc).length > 1 && (
                          <div className="flex items-center gap-2 mb-2">
                            <Disc className="h-4 w-4 text-zinc-400" />
                            <span className="font-semibold">Disc {discNum}</span>
                          </div>
                        )}
                        <table className="min-w-full text-sm border-separate border-spacing-y-1">
                          <thead>
                            <tr className="text-zinc-400">
                              <th className="w-12 text-center">#</th>
                              <th className="w-10"></th>
                              <th className="text-left">Title</th>
                              <th className="w-24 text-center">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tracksPerDisc[Number(discNum)].map((track) => (
                              <tr
                                key={track.Id}
                                className="group hover:bg-zinc-800 rounded cursor-pointer"
                                onDoubleClick={() => {
                                  /* TODO: trigger play */
                                }}
                              >
                                <td className="text-center font-mono">
                                  {track.IndexNumber}
                                </td>
                                <td className="text-center">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      /* TODO: trigger play */
                                    }}
                                  >
                                    <Play className="h-5 w-5" />
                                  </Button>
                                </td>
                                <td className="text-left">
                                  <span className="font-medium">
                                    {track.Name}
                                  </span>
                                  {track.ArtistItems &&
                                    track.ArtistItems.length > 0 && (
                                      <span className="ml-2 text-zinc-400">
                                        {track.ArtistItems.map(
                                          (a) => a.Name
                                        ).join(", ")}
                                      </span>
                                    )}
                                </td>
                                <td className="text-center font-mono">
                                  {formatTrackTime(track.RunTimeTicks)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
