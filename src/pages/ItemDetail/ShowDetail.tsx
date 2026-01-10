import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import {
  getItem,
  getSeasons,
  getEpisodes,
  getImageUrl,
} from "@/lib/jellyfin/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Clock,
  Calendar,
  Star,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
} from "lucide-react";
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
  formatRuntime,
} from "./shared";

export default function ShowDetail() {
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
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState<
    number | undefined
  >();
  const seasonsRowRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const fetchSeasons = async () => {
      if (!serverUrl || !userId || !accessToken || !itemId || !item) return;

      // Handle case where item is a Season - use SeriesId to fetch seasons
      let seriesIdToUse = itemId;
      let isSeriesType = item.Type === "Series";

      if (item.Type === "Season" && (item as any).SeriesId) {
        seriesIdToUse = (item as any).SeriesId;
        isSeriesType = true;
      }

      if (!isSeriesType) return;

      setLoadingSeasons(true);
      const seasonsResult = await getSeasons(
        serverUrl,
        userId,
        seriesIdToUse,
        accessToken
      );

      if (seasonsResult.success && seasonsResult.data) {
        setSeasons(seasonsResult.data);

        if (!selectedSeasonId && seasonsResult.data[0]?.Id) {
          setSelectedSeasonId(seasonsResult.data[0].Id || null);
        }

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
      } else {
        console.warn("Failed to fetch seasons", seasonsResult);
        setSeasons([]);
      }

      setLoadingSeasons(false);
    };

    fetchSeasons();
  }, [serverUrl, userId, accessToken, itemId, item]);

  useEffect(() => {
    if (seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0]?.Id || null);
    }
  }, [seasons, selectedSeasonId]);

  if (loading) return <LoadingState />;
  if (!item) return <NotFoundState />;

  const primaryImageUrl = getPrimaryImageUrl(serverUrl, item);
  const backdropUrl =
    item.Id && serverUrl
      ? getImageUrl(serverUrl, item.Id, "Backdrop", 1280, 720, 90)
      : undefined;
  const isSeries =
    item?.Type === "Series" ||
    (item?.Type === "Season" && (item as any).SeriesId);

  const nextUpSeasonId =
    selectedSeasonId || (seasons.length > 0 ? seasons[0]?.Id || null : null);
  const nextUpEpisode = nextUpSeasonId
    ? seasonEpisodes[nextUpSeasonId]?.[0]
    : undefined;

  const scrollSeasons = (direction: number) => {
    if (!seasonsRowRef.current) return;
    const containerWidth = seasonsRowRef.current.clientWidth;
    const scrollAmount = containerWidth * direction;
    seasonsRowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <Layout backdropUrl={backdropUrl}>
      <div className="min-h-screen pb-40">
        <div className="mx-auto pr-10 pl-15 py-2">
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
                  alt={item.Name || "Show"}
                  className="w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full aspect-2/3 shadow-lg rounded-lg flex items-center justify-center">
                  <span className="text-zinc-600">No Image</span>
                </div>
              )}
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

              {/* Next Up */}
              {isSeries && nextUpEpisode && (
                <div className="flex flex-col items-start space-y-3">
                  <h3 className="text-2xl font-semibold">Next Up</h3>
                  <Card
                    className="bg-base-200 border-base-300 hover:border-primary/50 transition-colors cursor-pointer max-w-120"
                    onClick={() => navigate(`/play/${nextUpEpisode.Id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="relative w-full h-44 rounded-lg overflow-hidden">
                        {nextUpEpisode.ImageTags?.Primary && serverUrl ? (
                          <img
                            src={getImageUrl(
                              serverUrl,
                              nextUpEpisode.Id!,
                              "Primary",
                              640,
                              360,
                              85
                            )}
                            alt={nextUpEpisode.Name || "Next up"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-base-300 flex items-center justify-center">
                            <Play className="h-10 w-10 text-zinc-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30" />
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="text-sm text-zinc-400">
                          {nextUpEpisode.SeriesName}
                        </div>
                        <div className="text-white font-semibold line-clamp-1">
                          {nextUpEpisode.IndexNumber &&
                            `${nextUpEpisode.IndexNumber}. `}
                          {nextUpEpisode.Name}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Seasons & Episodes */}
              {isSeries && seasons.length > 0 && (
                <div className="flex flex-col items-start space-y-3">
                  <h3 className="text-2xl font-semibold mb-4">Seasons</h3>
                  {loadingSeasons ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-10 w-full bg-base-300 rounded" />
                      <div className="h-32 w-full bg-base-300 rounded" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => scrollSeasons(-1)}
                            className="h-8 w-8"
                          >
                            <ChevronLeft className="size-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => scrollSeasons(1)}
                            className="h-8 w-8"
                          >
                            <ChevronRight className="size-5" />
                          </Button>
                        </div>
                      </div>
                      <div
                        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 w-full"
                        ref={seasonsRowRef}
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {seasons.map((season) => (
                          <Button
                            key={season.Id}
                            variant="ghost"
                            className={`relative flex h-auto min-h-0 flex-col items-start p-0 text-left rounded-lg overflow-hidden border shrink-0 ${
                              selectedSeasonId === season.Id
                                ? "border-primary/40"
                                : "border-transparent"
                            } bg-base-200 hover:border-primary transition-colors snap-start`}
                            style={{ width: "calc(16.666% - 8px)" }}
                            onClick={() =>
                              setSelectedSeasonId(season.Id || null)
                            }
                          >
                            <div
                              className="w-full bg-base-300 relative"
                              style={{ aspectRatio: "2 / 3" }}
                            >
                              {season.ImageTags?.Primary &&
                              serverUrl &&
                              season.Id ? (
                                <img
                                  src={getImageUrl(
                                    serverUrl,
                                    season.Id,
                                    "Primary",
                                    400,
                                    600,
                                    85
                                  )}
                                  alt={season.Name || "Season"}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                  <Play className="h-8 w-8" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                {seasonEpisodes[season.Id || ""]?.length || 0}
                              </div>
                            </div>
                            <div className="w-full p-3 text-left">
                              <div className="text-white font-semibold line-clamp-1">
                                {season.Name}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>

                      {selectedSeasonId && (
                        <div className="space-y-4">
                          {seasonEpisodes[selectedSeasonId]?.map((episode) => (
                            <Card
                              key={episode.Id}
                              className="bg-base-200 border-base-300 hover:border-primary/50 transition-colors"
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
                                          "Primary",
                                          512,
                                          288,
                                          85
                                        )}
                                        alt={episode.Name || "Episode"}
                                        className="w-full h-full object-cover rounded-l-lg"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-base-300 flex items-center justify-center rounded-l-lg">
                                        <Play className="h-12 w-12 text-base-content/40" />
                                      </div>
                                    )}
                                    {/* Watched indicator */}
                                    {episode.UserData?.Played && (
                                      <div className="absolute top-2 right-2 rounded-full p-1 shadow-lg">
                                        <CircleCheck className="size-6  text-green-700/90" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-l-lg">
                                      <button
                                        className="h-20 w-20 rounded-full hover:bg-white/30 hover:scale-110 flex items-center justify-center transition-all cursor-pointer shadow-2xl border-2 border-white/20"
                                        onClick={() =>
                                          navigate(`/play/${episode.Id}`)
                                        }
                                      >
                                        <Play className="h-10 w-10 text-white/60 fill-white/60" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Episode Info */}
                                  <div className="flex-1 p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex flex-col items-start">
                                        <h4 className="text-lg font-semibold">
                                          {episode.IndexNumber &&
                                            `${episode.IndexNumber}. `}
                                          {episode.Name}
                                        </h4>
                                        <div className="flex items-start gap-3 text-sm text-zinc-400 mt-1">
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
                                      <p className="text-sm text-zinc-400 text-left line-clamp-2 mt-2">
                                        {episode.Overview}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <CastAndCrewSection item={item} serverUrl={serverUrl} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
