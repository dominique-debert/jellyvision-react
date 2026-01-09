import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getItem, getImageUrl, getAlbumTracks } from "@/lib/jellyfin/client";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  ArrowLeft,
} from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function AudioPlayer() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [albumTracks, setAlbumTracks] = useState<BaseItemDto[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Fetch item metadata
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

        // If it's an album, fetch all tracks
        if (result.data.Type === "MusicAlbum") {
          const tracksResult = await getAlbumTracks(
            serverUrl,
            userId,
            itemId,
            accessToken
          );
          if (tracksResult.success && tracksResult.data) {
            setAlbumTracks(tracksResult.data);
            setCurrentTrackIndex(0);
          }
        }
      }

      setLoading(false);
    };

    fetchItem();
  }, [serverUrl, userId, accessToken, itemId]);

  const getStreamUrl = useCallback(() => {
    if (!serverUrl || !accessToken) return "";

    // If we have album tracks, use the current track; otherwise use the item
    let trackId = itemId;
    if (albumTracks.length > 0 && currentTrackIndex < albumTracks.length) {
      trackId = albumTracks[currentTrackIndex].Id;
    }

    if (!trackId) return "";

    const params = new URLSearchParams();
    params.set("static", "true");
    params.set("api_key", accessToken);
    return `${serverUrl}/Audio/${trackId}/stream?${params.toString()}`;
  }, [serverUrl, itemId, accessToken, albumTracks, currentTrackIndex]);

  // Initialize audio player
  useEffect(() => {
    if (!audioRef.current || !item) return;

    const streamUrl = getStreamUrl();
    if (streamUrl) {
      audioRef.current.src = streamUrl;
      // Auto-play
      audioRef.current.play().catch((e) => {
        console.error("Auto-play failed (may require user interaction):", e);
      });
    }
  }, [item, getStreamUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
    if (albumTracks.length > 0) {
      // Move to previous track in album
      if (currentTrackIndex > 0) {
        setCurrentTrackIndex(currentTrackIndex - 1);
      } else {
        setCurrentTrackIndex(0);
      }
    } else if (audioRef.current) {
      // Skip back 10 seconds
      audioRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (albumTracks.length > 0) {
      // Move to next track in album
      if (currentTrackIndex < albumTracks.length - 1) {
        setCurrentTrackIndex(currentTrackIndex + 1);
      } else if (repeatMode === "all") {
        setCurrentTrackIndex(0);
      }
    } else if (audioRef.current) {
      // Skip forward 10 seconds
      audioRef.current.currentTime = Math.min(duration, currentTime + 10);
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
    if (albumTracks.length > 0) {
      if (currentTrackIndex < albumTracks.length - 1) {
        setCurrentTrackIndex(currentTrackIndex + 1);
      } else if (repeatMode === "all") {
        setCurrentTrackIndex(0);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Track not found</div>
      </div>
    );
  }

  const albumArtUrl =
    item.Id && serverUrl
      ? getImageUrl(serverUrl, item.Id, "Primary")
      : undefined;

  // Get current track info for album display
  const currentTrack =
    albumTracks.length > 0 ? albumTracks[currentTrackIndex] : item;

  const isPlayingAlbum = albumTracks.length > 0;

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <button
          className="btn btn-ghost btn-sm text-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-8 px-6 overflow-hidden justify-center">
        {/* Left Column - Player */}
        <div className="flex flex-col items-center justify-center h-full">
          {/* Album Art */}
          <div className="mb-8">
            {albumArtUrl ? (
              <img
                src={albumArtUrl}
                alt={item.Name || ""}
                className="w-64 h-64 rounded-lg shadow-2xl object-cover"
              />
            ) : (
              <div className="w-64 h-64 bg-linear-to-br from-amber-500 to-amber-700 rounded-lg shadow-2xl flex items-center justify-center">
                <span className="text-6xl">🎵</span>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="text-center mb-8">
            {isPlayingAlbum && (
              <p className="text-sm text-gray-500 mb-2">
                Track {currentTrackIndex + 1} of {albumTracks.length}
              </p>
            )}
            <h1 className="text-4xl font-bold text-white mb-2">
              {currentTrack?.Name || item.Name}
            </h1>
            {currentTrack?.AlbumArtist && (
              <p className="text-lg text-gray-400">
                {currentTrack.AlbumArtist}
              </p>
            )}
            {item.Album && (
              <p className="text-sm text-gray-500">{item.Album}</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mb-6">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-2 rounded-full bg-gray-700 accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-6 mb-8">
            <button
              className="btn btn-ghost btn-circle text-white"
              onClick={handleSkipBack}
            >
              <SkipBack className="h-6 w-6" />
            </button>

            <button
              className="btn btn-circle btn-lg bg-amber-500 hover:bg-amber-600 border-0"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-white fill-white" />
              ) : (
                <Play className="h-8 w-8 text-white fill-white" />
              )}
            </button>

            <button
              className="btn btn-ghost btn-circle text-white"
              onClick={handleSkipForward}
            >
              <SkipForward className="h-6 w-6" />
            </button>
          </div>

          {/* Volume & Repeat Controls */}
          <div className="flex items-center gap-8 w-full max-w-md justify-center">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              {volume === 0 ? (
                <VolumeX className="h-5 w-5 text-gray-400" />
              ) : (
                <Volume2 className="h-5 w-5 text-gray-400" />
              )}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 h-2 rounded-full bg-gray-700 accent-amber-500"
              />
            </div>

            {/* Repeat Mode */}
            <button
              className={`btn btn-ghost btn-circle ${
                repeatMode !== "off"
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-gray-400"
              }`}
              onClick={toggleRepeatMode}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="h-5 w-5" />
              ) : (
                <Repeat className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Tracklist (only show for albums) */}
        {isPlayingAlbum && (
          <div className="hidden lg:flex flex-col w-80 h-full bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm border border-gray-700 overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-4">
              {item.Album || "Album"}
            </h2>
            <div className="overflow-y-auto flex-1 space-y-1">
              {albumTracks.map((track, index) => (
                <button
                  key={track.Id}
                  onClick={() => setCurrentTrackIndex(index)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    index === currentTrackIndex
                      ? "bg-amber-500/20 text-amber-400 border-l-2 border-amber-500"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-6 text-right shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{track.Name}</p>
                      {track.Artists?.[0] && (
                        <p className="text-xs text-gray-500 truncate">
                          {track.Artists[0]}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {track.RunTimeTicks
                        ? formatTime(track.RunTimeTicks / 10000000)
                        : "--:--"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
  );
}
