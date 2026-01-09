import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { getItem, getAlbumTracks } from "@/lib/jellyfin/client";
import { Button } from "@/components/ui/button";
import {
  Disc,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  ArrowLeft,
  X,
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
  const audioRef = useRef<HTMLAudioElement>(null);

  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [albumTracks, setAlbumTracks] = useState<BaseItemDto[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

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

  const handlePlayTrack = (trackId: string) => {
    setCurrentTrackId(trackId);
    const trackIndex = albumTracks.findIndex((t) => t.Id === trackId);
    if (trackIndex >= 0) {
      setCurrentTrackIndex(trackIndex);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStreamUrl = useCallback(() => {
    if (!serverUrl || !accessToken || !currentTrackId) return "";
    const params = new URLSearchParams();
    params.set("static", "true");
    params.set("api_key", accessToken);
    return `${serverUrl}/Audio/${currentTrackId}/stream?${params.toString()}`;
  }, [serverUrl, accessToken, currentTrackId]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipBack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      const prevTrack = albumTracks[currentTrackIndex - 1];
      if (prevTrack.Id) setCurrentTrackId(prevTrack.Id);
    }
  };

  const handleSkipForward = () => {
    if (currentTrackIndex < albumTracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      const nextTrack = albumTracks[currentTrackIndex + 1];
      if (nextTrack.Id) setCurrentTrackId(nextTrack.Id);
    } else if (repeatMode === "all") {
      setCurrentTrackIndex(0);
      const firstTrack = albumTracks[0];
      if (firstTrack.Id) setCurrentTrackId(firstTrack.Id);
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleRepeatMode = () => {
    if (repeatMode === "off") {
      setRepeatMode("all");
      if (audioRef.current) audioRef.current.loop = false;
    } else if (repeatMode === "all") {
      setRepeatMode("one");
      if (audioRef.current) audioRef.current.loop = true;
    } else {
      setRepeatMode("off");
      if (audioRef.current) audioRef.current.loop = false;
    }
  };

  const handleEnded = () => {
    if (currentTrackIndex < albumTracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      const nextTrack = albumTracks[currentTrackIndex + 1];
      if (nextTrack.Id) setCurrentTrackId(nextTrack.Id);
    } else if (repeatMode === "all") {
      setCurrentTrackIndex(0);
      const firstTrack = albumTracks[0];
      if (firstTrack.Id) setCurrentTrackId(firstTrack.Id);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  // Update audio source when track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrackId) return;
    const streamUrl = getStreamUrl();
    if (streamUrl) {
      audioRef.current.src = streamUrl;
      audioRef.current.play().catch((e) => {
        console.error("Auto-play failed:", e);
      });
    }
  }, [currentTrackId, getStreamUrl]);

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
      <div className="min-h-screen bg-linear-to-br from-gray-900 to-black flex flex-col">
        <div className="flex-1 overflow-y-auto">
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
                <div className="relative group">
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
                  {/* Play Overlay */}
                  {albumTracks.length > 0 && (
                    <button
                      onClick={() => {
                        if (albumTracks[0].Id) {
                          handlePlayTrack(albumTracks[0].Id);
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="bg-amber-500 hover:bg-amber-600 rounded-full p-4">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </button>
                  )}
                </div>
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
                                  className={`group hover:bg-zinc-800 rounded cursor-pointer ${
                                    track.Id === currentTrackId
                                      ? "bg-amber-500/20"
                                      : ""
                                  }`}
                                  onDoubleClick={() => {
                                    if (track.Id) handlePlayTrack(track.Id);
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
                                        if (track.Id) handlePlayTrack(track.Id);
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

        {/* Embedded Player - Bottom */}
        {currentTrackId && (
          <div className="border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Track Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">
                  {albumTracks[currentTrackIndex]?.Name ||
                    "Track name"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {albumTracks[currentTrackIndex]?.AlbumArtist || "Artist"}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 flex-1 min-w-50">
                <span className="text-xs text-gray-400 w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="h-1 flex-1 rounded-full bg-gray-700 accent-amber-500"
                />
                <span className="text-xs text-gray-400 w-10">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
                  onClick={handleSkipBack}
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  className="p-1.5 bg-amber-500 hover:bg-amber-600 rounded transition-colors text-white"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-white" />
                  ) : (
                    <Play className="h-4 w-4 fill-white" />
                  )}
                </button>

                <button
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
                  onClick={handleSkipForward}
                >
                  <SkipForward className="h-4 w-4" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-600">
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-gray-400" />
                  )}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 h-1 rounded-full bg-gray-700 accent-amber-500"
                  />
                </div>

                {/* Repeat */}
                <button
                  className={`p-1.5 rounded transition-colors ml-2 ${
                    repeatMode !== "off"
                      ? "bg-amber-500/20 text-amber-400"
                      : "hover:bg-gray-700 text-gray-300 hover:text-white"
                  }`}
                  onClick={toggleRepeatMode}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                </button>

                {/* Close */}
                <button
                  className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white ml-2"
                  onClick={() => setCurrentTrackId(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      </div>
    </Layout>
  );
}
