import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
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
  Check,
  ArrowLeft,
  Volume2,
} from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function Player() {
  const { itemId } = useParams<{ itemId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [subtitleOptions, setSubtitleOptions] = useState<
    { index: number; label: string }[]
  >([]);
  const [subtitleIndex, setSubtitleIndex] = useState<number | undefined>(
    undefined
  );
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [volume, setVolume] = useState(1);

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeRef = useRef<number | null>(null);

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
        const subs =
          result.data.MediaStreams?.filter(
            (s) => s.Type === "Subtitle" && s.Index !== undefined
          ) || [];
        const options = subs.map((s) => ({
          index: s.Index!,
          label: s.Language || s.DisplayTitle || `Subtitle ${s.Index}`,
        }));
        setSubtitleOptions(options);
        const initial = searchParams.get("subtitle");
        if (initial) {
          setSubtitleIndex(Number(initial));
        } else if (options.length > 0) {
          setSubtitleIndex(options[0].index);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set("subtitle", String(options[0].index));
          setSearchParams(nextParams, { replace: true });
        }
      }

      setLoading(false);
    };

    fetchItem();
  }, [serverUrl, userId, accessToken, itemId, searchParams]);

  const getStreamUrl = (subtitle?: number) => {
    if (!serverUrl || !itemId || !accessToken) return "";
    const subtitleParam =
      subtitle !== undefined ? `&SubtitleStreamIndex=${subtitle}` : "";
    return `${serverUrl}/Videos/${itemId}/stream?static=true${subtitleParam}&api_key=${accessToken}`;
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
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0;
      setDuration(videoRef.current.duration);
      if (resumeTimeRef.current !== null) {
        videoRef.current.currentTime = resumeTimeRef.current;
        resumeTimeRef.current = null;
      }
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

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
    videoRef.current.muted = volume === 0;
  }, [volume]);

  const handleSubtitleSelect = (index?: number) => {
    setSubtitleIndex(index);
    const nextParams = new URLSearchParams(searchParams);
    if (index === undefined) {
      nextParams.delete("subtitle");
    } else {
      nextParams.set("subtitle", String(index));
    }
    setSearchParams(nextParams, { replace: true });
    setShowSubtitleMenu(false);
  };

  // Update stream when subtitle selection changes
  useEffect(() => {
    if (!videoRef.current) return;
    const nextUrl = getStreamUrl(subtitleIndex);
    resumeTimeRef.current = videoRef.current.currentTime;
    videoRef.current.src = nextUrl;
    videoRef.current.load();
  }, [subtitleIndex]);

  const handleBack = () => {
    if (itemId) {
      navigate(`/item/${itemId}`);
    } else {
      navigate(-1);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
  };

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
        src={getStreamUrl(subtitleIndex)}
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
        <div className="absolute top-6 left-6">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
        </div>

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
                onClick={() => setShowSubtitleMenu((v) => !v)}
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
              <div className="flex items-center gap-2 text-white w-36">
                <Volume2 className="h-5 w-5" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-28 h-2 rounded-full bg-white/20 accent-emerald-400"
                />
              </div>
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

        {showSubtitleMenu && (
          <div className="absolute bottom-32 left-8 w-64 bg-black/90 border border-white/10 rounded-lg shadow-2xl p-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-zinc-400">
              Subtitles
            </div>
            <button
              className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm text-white hover:bg-white/10 ${
                subtitleIndex === undefined ? "bg-white/10" : ""
              }`}
              onClick={() => handleSubtitleSelect(undefined)}
            >
              <span>None</span>
              {subtitleIndex === undefined && <Check className="h-4 w-4" />}
            </button>
            {subtitleOptions.length === 0 && (
              <div className="text-sm text-zinc-400 px-3 py-2">
                No subtitles
              </div>
            )}
            {subtitleOptions.map((opt) => (
              <button
                key={opt.index}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm text-white hover:bg-white/10 ${
                  subtitleIndex === opt.index ? "bg-white/10" : ""
                }`}
                onClick={() => handleSubtitleSelect(opt.index)}
              >
                <span>{opt.label}</span>
                {subtitleIndex === opt.index && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
