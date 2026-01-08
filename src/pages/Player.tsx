import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getItem, getImageUrl } from "@/lib/jellyfin/client";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MessageSquare,
  Maximize,
  Users,
} from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function Player() {
  const { itemId } = useParams<{ itemId: string }>();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

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

  const getStreamUrl = () => {
    if (!serverUrl || !itemId || !accessToken) return "";
    return `${serverUrl}/Videos/${itemId}/stream?static=true&api_key=${accessToken}`;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEndTime = () => {
    const now = new Date();
    const remaining = duration - currentTime;
    const endTime = new Date(now.getTime() + remaining * 1000);
    return endTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);

    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Item not found</div>
      </div>
    );
  }

  const posterUrl =
    item.Id && serverUrl
      ? getImageUrl(serverUrl, item.Id, "Primary")
      : undefined;

  return (
    <div
      className="relative h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Video Player */}
      <video
        ref={videoRef}
        src={getStreamUrl()}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlayPause}
      />

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-linear-to-t from-black via-transparent to-black transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top Left - Movie Info */}
        <div className="absolute top-8 left-8 flex items-start gap-4">
          {posterUrl && (
            <img
              src={posterUrl}
              alt={item.Name || ""}
              className="w-24 h-36 object-cover rounded-lg shadow-2xl"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{item.Name}</h1>
            {item.ProductionYear && (
              <p className="text-zinc-400">{item.ProductionYear}</p>
            )}
          </div>
        </div>

        {/* Top Right - Time */}
        <div className="absolute top-8 right-8">
          <div className="text-4xl font-light text-white">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <span className="text-white font-medium min-w-15">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek([Number(e.target.value)])}
              className="flex-1 h-2 rounded-full bg-white/20 accent-emerald-400"
            />
            <span className="text-white font-medium min-w-20">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Users className="h-6 w-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <div className="text-sm font-bold border border-white px-2 py-1 rounded">
                  HD
                </div>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={handleFullscreen}
              >
                <Maximize className="h-6 w-6" />
              </Button>
            </div>

            {/* Center Playback Controls */}
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-12 w-12"
                onClick={handleSkipBack}
              >
                <SkipBack className="h-8 w-8" />
              </Button>
              <Button
                size="icon"
                className="bg-white hover:bg-gray-200 h-16 w-16 rounded-full"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-10 w-10 text-black fill-black" />
                ) : (
                  <Play className="h-10 w-10 text-black fill-black" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-12 w-12"
                onClick={handleSkipForward}
              >
                <SkipForward className="h-8 w-8" />
              </Button>
            </div>

            {/* Right - End Time */}
            <div className="text-white text-sm">
              {duration > 0 && `Ends at ${getEndTime()}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
