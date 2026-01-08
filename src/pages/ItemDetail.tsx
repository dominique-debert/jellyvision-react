import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import {
  getItem,
  getImageUrl,
  getSeasons,
  getEpisodes,
  getAlbumTracks,
} from "@/lib/jellyfin/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Star,
  Clock,
  Calendar,
  Disc,
  Film,
  Bookmark,
  Check,
  Printer,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function ItemDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<BaseItemDto[]>([]);
  const [seasonEpisodes, setSeasonEpisodes] = useState<
    Record<string, BaseItemDto[]>
  >({});
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  // Album tracks state (MusicAlbum only)
  const [albumTracks, setAlbumTracks] = useState<BaseItemDto[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  // Fetch album tracks for MusicAlbum
  useEffect(() => {
    if (!serverUrl || !userId || !accessToken || !itemId || !item) return;
    if (item.Type !== "MusicAlbum") return;
    setLoadingTracks(true);
    getAlbumTracks(serverUrl, userId, itemId, accessToken).then((result) => {
      if (result.success && result.data) {
        setAlbumTracks(result.data);
      } else {
        setAlbumTracks([]);
      }
      setLoadingTracks(false);
    });
  }, [serverUrl, userId, accessToken, itemId, item]);

  // Group tracks by disc number and format time (MusicAlbum only)
  const tracksPerDisc: Record<number, BaseItemDto[]> = {};
  function formatTrackTime(ticks?: number | null) {
    if (!ticks) return "";
    const totalSeconds = Math.floor(ticks / 10000000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  if (item?.Type === "MusicAlbum" && albumTracks.length > 0) {
    for (const track of albumTracks) {
      const disc = track.ParentIndexNumber ?? 1;
      if (!tracksPerDisc[disc]) tracksPerDisc[disc] = [];
      tracksPerDisc[disc].push(track);
    }
  }

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
    const fetchSeasons = async () => {
      if (!serverUrl || !userId || !accessToken || !itemId || !item) return;
      if (item.Type !== "Series") return;

      setLoadingSeasons(true);
      const seasonsResult = await getSeasons(
        serverUrl,
        userId,
        itemId,
        accessToken
      );

      if (seasonsResult.success) {
        setSeasons(seasonsResult.data);

        // Fetch episodes for each season
        const episodesMap: Record<string, BaseItemDto[]> = {};
        for (const season of seasonsResult.data) {
          if (season.Id) {
            const episodesResult = await getEpisodes(
              serverUrl,
              userId,
              season.Id,
              accessToken
            );
            if (episodesResult.success) {
              episodesMap[season.Id] = episodesResult.data;
            }
          }
        }
        setSeasonEpisodes(episodesMap);
      }

      setLoadingSeasons(false);
    };

    fetchSeasons();
  }, [serverUrl, userId, accessToken, itemId, item]);

  const formatRuntime = (ticks?: number) => {
    if (!ticks) return null;
    const minutes = Math.floor(ticks / 600000000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getPrimaryImageUrl = () => {
    if (!serverUrl || !item?.Id) return undefined;
    if (item.ImageTags?.Primary) {
      return getImageUrl(serverUrl, item.Id, "Primary");
    }
    return undefined;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-zinc-800 rounded" />
            <div className="h-96 bg-zinc-800 rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!item) {
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
  }

  const primaryImageUrl = getPrimaryImageUrl();
  const isSeries = item.Type === "Series";
  const isEpisode = item.Type === "Episode";

  // Get directors, screenwriters, and actors
  const directors = item.People?.filter((p) => p.Type === "Director") || [];
  const writers = item.People?.filter((p) => p.Type === "Writer") || [];
  const actors = item.People?.filter((p) => p.Type === "Actor") || [];

  // Get quality badges
  const has4K = item.MediaStreams?.some(
    (s) => s.Type === "Video" && s.Width && s.Width >= 3800
  );
  const hasHDR = item.MediaStreams?.some(
    (s) => s.Type === "Video" && s.VideoRangeType && s.VideoRangeType !== "SDR"
  );

  return (
    <Layout>
      <div className="min-h-screen bg-linear-to-br from-gray-900 to-black">
        <div className="container mx-auto px-8 py-8 max-w-400">
          <div className="flex gap-8">
            {/* Left Column - Poster */}
            <div className="w-80 shrink-0">
              {primaryImageUrl ? (
                <img
                  src={primaryImageUrl}
                  alt={item.Name || "Item"}
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
              {/* Header with title and action buttons */}
              <div className="flex items-start justify-between">
                <h1 className="text-5xl font-bold text-amber-500">
                  {item.Name}
                </h1>
                <div className="flex gap-3">
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white hover:bg-gray-200"
                  >
                    <Play className="h-6 w-6 text-black fill-black" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-sm"
                  >
                    <Film className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-sm"
                  >
                    <Bookmark className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-sm"
                  >
                    <Check className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-sm"
                  >
                    <Printer className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-sm"
                  >
                    <MoreHorizontal className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Quality Badges */}
              <div className="flex gap-2">
                {has4K && (
                  <Badge className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1">
                    4K
                  </Badge>
                )}
                {hasHDR && (
                  <Badge className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1">
                    HDR
                  </Badge>
                )}
              </div>

              {/* Metadata Table */}
              <div className="grid grid-cols-4 gap-6 text-sm">
                <div>
                  <div className="text-amber-500 font-medium mb-1">Date</div>
                  <div className="text-white">
                    {item.ProductionYear || item.PremiereDate
                      ? new Date(
                          item.PremiereDate || `${item.ProductionYear}-01-01`
                        ).getFullYear()
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-amber-500 font-medium mb-1">
                    Duration
                  </div>
                  <div className="text-white">
                    {item.RunTimeTicks ? formatRuntime(item.RunTimeTicks) : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-amber-500 font-medium mb-1">
                    Certification
                  </div>
                  <div className="text-white">{item.OfficialRating || "-"}</div>
                </div>
                <div>
                  <div className="text-amber-500 font-medium mb-1">Genre</div>
                  <div className="text-white">
                    {item.Genres?.join(", ") || "-"}
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              {item.Overview && (
                <div>
                  <h2 className="text-amber-500 font-medium mb-2">Synopsis</h2>
                  <p className="text-zinc-300 leading-relaxed">
                    {item.Overview}
                  </p>
                </div>
              )}

              {/* Cast and Crew Section */}
              <div>
                <div className="flex gap-8">
                  {/* Left: Crew List (Vertical) */}
                  <div className="w-56 shrink-0 space-y-6">
                    {/* Directors */}
                    <div>
                      <h3 className="text-amber-500 font-medium mb-3">
                        Directors
                      </h3>
                      {directors.length > 0 ? (
                        <div className="space-y-1">
                          {directors.map((director) => (
                            <div
                              key={director.Id}
                              className="text-white text-sm"
                            >
                              {director.Name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-sm">
                          No directors found
                        </div>
                      )}
                    </div>

                    {/* Screenwriters */}
                    <div>
                      <h3 className="text-amber-500 font-medium mb-3">
                        Screenwriters
                      </h3>
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
                    <h3 className="text-amber-500 font-medium mb-4">Actors</h3>
                    {actors.filter((a) => a.PrimaryImageTag).length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {actors
                          .filter(
                            (actor) =>
                              actor.PrimaryImageTag && serverUrl && actor.Id
                          )
                          .slice(0, 10)
                          .map((actor) => (
                            <div
                              key={actor.Id}
                              className="flex flex-col items-center"
                            >
                              <img
                                src={getImageUrl(
                                  serverUrl!,
                                  actor.Id!,
                                  "Primary"
                                )}
                                alt={actor.Name || "Actor"}
                                className="w-20 h-20 rounded-full object-cover mb-2"
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

              {/* Series Episodes Section */}
              {isSeries && seasons.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-2xl font-semibold mb-4">Episodes</h3>
                  {loadingSeasons ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-10 w-full bg-zinc-800 rounded" />
                      <div className="h-32 w-full bg-zinc-800 rounded" />
                    </div>
                  ) : (
                    <Tabs
                      defaultValue={seasons[0]?.Id || ""}
                      className="w-full"
                    >
                      <TabsList className="w-full justify-start overflow-x-auto">
                        {seasons.map((season) => (
                          <TabsTrigger key={season.Id} value={season.Id || ""}>
                            {season.Name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {seasons.map((season) => (
                        <TabsContent
                          key={season.Id}
                          value={season.Id || ""}
                          className="mt-4"
                        >
                          <div className="space-y-4">
                            {seasonEpisodes[season.Id || ""]?.map((episode) => (
                              <Card
                                key={episode.Id}
                                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                                onClick={() => navigate(`/item/${episode.Id}`)}
                              >
                                <CardContent className="p-0">
                                  <div className="flex gap-4">
                                    {/* Episode Thumbnail */}
                                    <div className="relative w-64 h-36 shrink-0">
                                      {episode.ImageTags?.Primary &&
                                      serverUrl &&
                                      episode.Id ? (
                                        <img
                                          src={getImageUrl(
                                            serverUrl,
                                            episode.Id,
                                            "Primary"
                                          )}
                                          alt={episode.Name || "Episode"}
                                          className="w-full h-full object-cover rounded-l-lg"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center rounded-l-lg">
                                          <Play className="h-12 w-12 text-zinc-600" />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-l-lg">
                                        <Button
                                          size="icon"
                                          className="h-12 w-12 rounded-full"
                                        >
                                          <Play className="h-6 w-6" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Episode Info */}
                                    <div className="flex-1 p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <h4 className="text-lg font-semibold">
                                            {episode.IndexNumber &&
                                              `${episode.IndexNumber}. `}
                                            {episode.Name}
                                          </h4>
                                          <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                                            {episode.RunTimeTicks && (
                                              <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatRuntime(
                                                  episode.RunTimeTicks
                                                )}
                                              </div>
                                            )}
                                            {episode.PremiereDate && (
                                              <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(
                                                  episode.PremiereDate
                                                ).toLocaleDateString()}
                                              </div>
                                            )}
                                            {episode.CommunityRating && (
                                              <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                {episode.CommunityRating.toFixed(
                                                  1
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      {episode.Overview && (
                                        <p className="text-sm text-zinc-400 line-clamp-2 mt-2">
                                          {episode.Overview}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </div>
              )}

              {/* Episode-specific Info */}
              {isEpisode && (
                <div className="space-y-4">
                  {item.SeriesName && (
                    <div>
                      <span className="text-zinc-400">Series: </span>
                      <span>{item.SeriesName}</span>
                    </div>
                  )}
                  {(item.ParentIndexNumber !== undefined ||
                    item.IndexNumber !== undefined) && (
                    <div>
                      <span className="text-zinc-400">Episode: </span>
                      <span>
                        {item.ParentIndexNumber && `S${item.ParentIndexNumber}`}
                        {item.IndexNumber && `E${item.IndexNumber}`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Music Album Info */}
              {item.Type === "MusicAlbum" && (
                <div className="space-y-6">
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
                                <span className="font-semibold">
                                  Disc {discNum}
                                </span>
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
                                          e.stopPropagation(); /* TODO: trigger play */
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
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
