import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
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
  ArrowLeft,
  Play,
  Star,
  Clock,
  Calendar,
  Music,
  Disc,
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
  let tracksPerDisc: Record<number, BaseItemDto[]> = {};
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

  const getBackdropUrl = () => {
    if (!serverUrl || !item?.Id) return undefined;
    if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
      return getImageUrl(serverUrl, item.Id, "Backdrop");
    }
    if (
      item.ParentBackdropImageTags &&
      item.ParentBackdropImageTags.length > 0 &&
      item.ParentBackdropItemId
    ) {
      return getImageUrl(serverUrl, item.ParentBackdropItemId, "Backdrop");
    }
    return undefined;
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
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-zinc-800 rounded" />
          <div className="h-96 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-zinc-400">Item not found</p>
      </div>
    );
  }

  const backdropUrl = getBackdropUrl();
  const primaryImageUrl = getPrimaryImageUrl();
  const isMovie = item.Type === "Movie";
  const isSeries = item.Type === "Series";
  const isEpisode = item.Type === "Episode";
  const isMusic = item.Type === "Audio" || item.Type === "MusicAlbum";

  return (
    <div className="min-h-screen">
      {/* Backdrop */}
      {backdropUrl && (
        <div className="fixed inset-0 z-0">
          <img
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/80 to-black/60" />
        </div>
      )}

      <div className="relative z-10 container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Poster */}
          <div className="lg:col-span-1">
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

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button className="w-full" size="lg">
                <Play className="mr-2 h-5 w-5" />
                Play
              </Button>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {item.Name}
              </h1>
              {item.OriginalTitle && item.OriginalTitle !== item.Name && (
                <p className="text-xl text-zinc-400">{item.OriginalTitle}</p>
              )}
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {item.ProductionYear && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span>{item.ProductionYear}</span>
                </div>
              )}
              {item.OfficialRating && (
                <Badge variant="secondary">{item.OfficialRating}</Badge>
              )}
              {item.CommunityRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span>{item.CommunityRating.toFixed(1)}</span>
                </div>
              )}
              {item.RunTimeTicks && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span>{formatRuntime(item.RunTimeTicks)}</span>
                </div>
              )}
              {isMusic && item.ChildCount && (
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-zinc-400" />
                  <span>{item.ChildCount} tracks</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {item.Genres && item.Genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.Genres.map((genre) => (
                  <Badge key={genre} variant="outline">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Overview */}
            {item.Overview && (
              <div>
                <h2 className="text-2xl font-semibold mb-3">Overview</h2>
                <p className="text-zinc-300 leading-relaxed">{item.Overview}</p>
              </div>
            )}

            {/* Movie-specific Info */}
            {isMovie && (
              <div className="space-y-4">
                {item.Studios && item.Studios.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Studios</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.Studios.map((studio) => (
                        <Badge key={studio.Id} variant="secondary">
                          {studio.Name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Series-specific Info */}
            {isSeries && (
              <div className="space-y-4">
                {item.Status && (
                  <div>
                    <span className="text-zinc-400">Status: </span>
                    <span className="capitalize">{item.Status}</span>
                  </div>
                )}
                {item.CumulativeRunTimeTicks && (
                  <div>
                    <span className="text-zinc-400">Total Runtime: </span>
                    <span>{formatRuntime(item.CumulativeRunTimeTicks)}</span>
                  </div>
                )}

                {/* Episodes Section */}
                {seasons.length > 0 && (
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
                            <TabsTrigger
                              key={season.Id}
                              value={season.Id || ""}
                            >
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
                              {seasonEpisodes[season.Id || ""]?.map(
                                (episode) => (
                                  <Card
                                    key={episode.Id}
                                    className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                                    onClick={() =>
                                      navigate(`/item/${episode.Id}`)
                                    }
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
                                )
                              )}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
                  </div>
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

            {/* Cast */}
            {item.People && item.People.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Cast & Crew</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {item.People.slice(0, 12).map((person) => (
                    <Card
                      key={person.Id}
                      className="bg-zinc-900 border-zinc-800"
                    >
                      <CardContent className="p-4">
                        {person.PrimaryImageTag && serverUrl && person.Id && (
                          <img
                            src={getImageUrl(serverUrl, person.Id, "Primary")}
                            alt={person.Name || "Person"}
                            className="w-full aspect-square object-cover rounded-lg mb-2"
                          />
                        )}
                        <p className="font-medium text-sm truncate">
                          {person.Name}
                        </p>
                        {person.Role && (
                          <p className="text-xs text-zinc-400 truncate">
                            {person.Role}
                          </p>
                        )}
                        {person.Type && !person.Role && (
                          <p className="text-xs text-zinc-400 truncate">
                            {person.Type}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Media Info */}
            {item.MediaStreams && item.MediaStreams.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Media Info</h2>
                <div className="space-y-3">
                  {/* Video Streams */}
                  {item.MediaStreams.filter((s) => s.Type === "Video").map(
                    (stream, idx) => (
                      <Card
                        key={`video-${idx}`}
                        className="bg-zinc-900 border-zinc-800"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Disc className="h-4 w-4 text-zinc-400" />
                            <span className="font-medium">Video</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400">
                            {stream.DisplayTitle && (
                              <div>
                                <span className="text-zinc-500">Codec: </span>
                                {stream.DisplayTitle}
                              </div>
                            )}
                            {stream.Width && stream.Height && (
                              <div>
                                <span className="text-zinc-500">
                                  Resolution:{" "}
                                </span>
                                {stream.Width}x{stream.Height}
                              </div>
                            )}
                            {stream.BitRate && (
                              <div>
                                <span className="text-zinc-500">Bitrate: </span>
                                {(stream.BitRate / 1000000).toFixed(2)} Mbps
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}

                  {/* Audio Streams */}
                  {item.MediaStreams.filter((s) => s.Type === "Audio").map(
                    (stream, idx) => (
                      <Card
                        key={`audio-${idx}`}
                        className="bg-zinc-900 border-zinc-800"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Music className="h-4 w-4 text-zinc-400" />
                            <span className="font-medium">Audio</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400">
                            {stream.DisplayTitle && (
                              <div>
                                <span className="text-zinc-500">Track: </span>
                                {stream.DisplayTitle}
                              </div>
                            )}
                            {stream.Language && (
                              <div>
                                <span className="text-zinc-500">
                                  Language:{" "}
                                </span>
                                {stream.Language}
                              </div>
                            )}
                            {stream.Channels && (
                              <div>
                                <span className="text-zinc-500">
                                  Channels:{" "}
                                </span>
                                {stream.Channels}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.Tags && item.Tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {item.Tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
