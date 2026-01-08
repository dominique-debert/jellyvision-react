import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getItem, getImageUrl } from "@/lib/jellyfin/client";
import { Button } from "@/components/ui/button";
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
import * as shaka from "shaka-player";
import muxjs from "mux.js";

// Make mux.js available globally for shaka-player
if (typeof window !== "undefined") {
  (window as any).muxjs = muxjs;
}

export default function AudioPlayer() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);

  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

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
      }

      setLoading(false);
    };

    fetchItem();
  }, [serverUrl, userId, accessToken, itemId]);

  // Initialize Shaka Player
  useEffect(() => {
    const initializePlayer = async () => {
      if (!audioRef.current) return;

      try {
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
          console.error("Browser not supported by Shaka Player");
          return;
        }

        const player = new shaka.Player();
        playerRef.current = player;

        await player.attach(audioRef.current);

        player.addEventListener("error", (event: any) => {
          console.error("Player error:", event.detail);
        });

        if (item && serverUrl && accessToken && itemId) {
          const streamUrl = getStreamUrl();
          try {
            await player.load(streamUrl);
            audioRef.current?.play();
            setIsPlaying(true);
          } catch (e) {
            console.error("Error loading stream:", e);
          }
        }
      } catch (e) {
        console.error("Error initializing player:", e);
      }
    };

    if (item && !loading) {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.detach();
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [item, loading, serverUrl, accessToken, itemId]);

  const getStreamUrl = () => {
    if (!serverUrl || !itemId || !accessToken) return "";
    const params = new URLSearchParams();
    params.set("static", "true");
    params.set("api_key", accessToken);
    return `${serverUrl}/Audio/${itemId}/stream?${params.toString()}`;
  };

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
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Track not found</div>
      </div>
    );
  }

  const albumArtUrl =
    item.Id && serverUrl
      ? getImageUrl(serverUrl, item.Id, "Primary")
      : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* Album Art */}
        <div className="mb-8">
          {albumArtUrl ? (
            <img
              src={albumArtUrl}
              alt={item.Name || ""}
              className="w-64 h-64 rounded-lg shadow-2xl object-cover"
            />
          ) : (
            <div className="w-64 h-64 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg shadow-2xl flex items-center justify-center">
              <span className="text-6xl">🎵</span>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{item.Name}</h1>
          {item.AlbumArtist && (
            <p className="text-lg text-gray-400">{item.AlbumArtist}</p>
          )}
          {item.Album && <p className="text-sm text-gray-500">{item.Album}</p>}
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
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10 h-10 w-10"
            onClick={handleSkipBack}
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            className="bg-amber-500 hover:bg-amber-600 h-16 w-16 rounded-full"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white fill-white" />
            ) : (
              <Play className="h-8 w-8 text-white fill-white" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10 h-10 w-10"
            onClick={handleSkipForward}
          >
            <SkipForward className="h-6 w-6" />
          </Button>
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
          <Button
            size="icon"
            variant="ghost"
            className={`h-10 w-10 ${
              repeatMode !== "off"
                ? "text-amber-500 hover:bg-amber-500/10"
                : "text-gray-400 hover:bg-white/10"
            }`}
            onClick={toggleRepeatMode}
          >
            {repeatMode === "one" ? (
              <Repeat1 className="h-5 w-5" />
            ) : (
              <Repeat className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
      />
    </div>
  );
}
