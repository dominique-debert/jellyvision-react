import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Hls from "hls.js";
import {
  getItem,
  getImageUrl,
  reportPlaybackProgress,
} from "@/lib/jellyfin/client";
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
  const [streamUrl, setStreamUrl] = useState("");

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const [playSessionId] = useState(
    () => Date.now().toString() + Math.random().toString(36).substr(2, 9)
  );

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
  }, [serverUrl, userId, accessToken, itemId, searchParams, setSearchParams]);

  // Build stream URL
  const buildStreamUrl = useCallback(
    (subtitle?: number): string => {
      if (!serverUrl || !itemId || !accessToken) return "";
      const params = new URLSearchParams();
      params.set("api_key", accessToken);
      params.set("DeviceId", "jellyvision-web");
      params.set("PlaySessionId", playSessionId);
      params.set("SegmentContainer", "ts");
      params.set("MinSegments", "1");
      params.set("BreakOnNonKeyFrames", "True");
      params.set("TranscodingMaxAudioChannels", "2");
      params.set("h264-profile", "high,main,baseline,constrainedbaseline");
      params.set("h264-level", "52");
      params.set("TranscodeReasons", "VideoCodecNotSupported");
      if (subtitle !== undefined) {
        params.set("SubtitleStreamIndex", String(subtitle));
      }
      const baseUrl =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
          ? "/jellyfin"
          : serverUrl;
      return `${baseUrl}/Videos/${itemId}/main.m3u8?${params.toString()}`;
    },
    [serverUrl, itemId, accessToken, playSessionId]
  );

  // Update stream URL state when buildStreamUrl changes
  useEffect(() => {
    const url = buildStreamUrl();
    setStreamUrl(url);
  }, [buildStreamUrl]);

  // Initialize HLS player when streamUrl changes
  useEffect(() => {
    if (!videoRef.current || !streamUrl || !item) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {});

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = streamUrl;
    }
  }, [streamUrl, item]);

  useEffect(() => {
    const initializePlayer = async () => {
      if (!videoRef.current || !item || !itemId) return;

      buildStreamUrl();
    };

    if (item && !loading) {
      initializePlayer();
    }
  }, [item, loading, itemId, buildStreamUrl]);

  // Load subtitles by fetching track events and creating VTT cues (Jellyfin approach)
  useEffect(() => {
    if (!videoRef.current || !item || subtitleOptions.length === 0) return;

    const loadSubtitles = async () => {
      // Wait for video to be ready
      await new Promise((resolve) => {
        if (videoRef.current!.readyState >= 2) {
          resolve(null);
        } else {
          videoRef.current!.addEventListener("canplay", () => resolve(null), {
            once: true,
          });
        }
      });

      // Clear all existing subtitle tracks
      while (videoRef.current!.textTracks.length > 0) {
        const track = videoRef.current!.textTracks[0];
        if (track.kind === "subtitles") {
          // Remove associated track element
          const trackElement = Array.from(
            videoRef.current!.querySelectorAll("track")
          ).find((t) => t.label === track.label);
          trackElement?.remove();
        }
      }

      // Load ALL subtitle tracks (not just the first one)
      if (subtitleOptions.length > 0 && serverUrl && itemId && accessToken) {
        // Get PlaybackInfo once for all subtitles
        const baseUrl =
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
            ? "/jellyfin"
            : serverUrl;

        try {
          const playbackInfoResponse = await fetch(
            `${baseUrl}/Items/${itemId}/PlaybackInfo?api_key=${accessToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                DeviceProfile: {
                  SubtitleProfiles: [{ Format: "vtt", Method: "External" }],
                },
              }),
            }
          );

          if (!playbackInfoResponse.ok) {
            return;
          }

          const playbackInfo = await playbackInfoResponse.json();
          const playbackMediaStreams =
            playbackInfo.MediaSources?.[0]?.MediaStreams || [];

          // Load each subtitle track
          for (const subtitleOption of subtitleOptions) {
            try {
              const optionIndex = subtitleOption.index;
              const optionLabel = subtitleOption.label;

              const playbackSubtitle = playbackMediaStreams.find(
                (s: Record<string, unknown>) =>
                  s.Type === "Subtitle" && s.Index === optionIndex
              );

              if (!playbackSubtitle?.DeliveryUrl) {
                continue;
              }

              // Build the full subtitle URL from DeliveryUrl
              let subtitleUrl = "";
              const deliveryUrl = playbackSubtitle.DeliveryUrl;
              // Use .js format (JSON) like jellyfin-web does, not .vtt
              const jsonDeliveryUrl = deliveryUrl.replace(".vtt", ".js");

              if (jsonDeliveryUrl.startsWith("http")) {
                subtitleUrl = jsonDeliveryUrl;
              } else if (jsonDeliveryUrl.startsWith("/")) {
                subtitleUrl = `${baseUrl}${jsonDeliveryUrl}`;
              } else {
                subtitleUrl = `${baseUrl}/${jsonDeliveryUrl}`;
              }

              // Fetch the subtitle JSON content (not VTT)
              const response = await fetch(subtitleUrl);

              if (!response.ok) {
                continue;
              }

              const subtitleData = await response.json();
              const trackEvents = subtitleData.TrackEvents || [];

              if (trackEvents.length === 0) {
                continue;
              }

              // Create a track element for this subtitle
              const track = videoRef.current!.addTextTrack(
                "subtitles",
                optionLabel
              );

              // Add cues from TrackEvents JSON (like jellyfin-web does)
              for (const trackEvent of trackEvents) {
                // TrackEvents have StartPositionTicks and EndPositionTicks (in 10 million ticks per second)
                const startSeconds = trackEvent.StartPositionTicks / 10000000;
                const endSeconds = trackEvent.EndPositionTicks / 10000000;
                const text = trackEvent.Text;

                if (text) {
                  const TrackCue: typeof VTTCue | typeof TextTrackCue =
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).VTTCue || (window as any).TextTrackCue;
                  const cue = new TrackCue(startSeconds, endSeconds, text);
                  // Position subtitles higher by adjusting the line property
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (cue as any).line = -4;
                  track.addCue(cue);
                }
              }

              // Set initial visibility based on subtitle index
              // Show the subtitle that matches the current subtitleIndex state, or first by default
              track.mode = subtitleIndex === optionIndex ? "showing" : "hidden";
            } catch {
              // Silent error
            }
          }
        } catch {
          // Silent error
        }
      }
    };

    loadSubtitles();
  }, [item?.Id, subtitleOptions, serverUrl, itemId, accessToken]);

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
    if (videoRef.current && item) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0;
      setDuration(videoRef.current.duration);

      // Resume from saved position if available
      if (item.UserData?.PlaybackPositionTicks) {
        const resumeSeconds = item.UserData.PlaybackPositionTicks / 10000000;
        videoRef.current.currentTime = resumeSeconds;
        setCurrentTime(resumeSeconds);
      }
      // Don't call play() here - let autoPlay attribute handle it
    }
  };

  const handlePlayEvent = () => {
    setIsPlaying(true);
  };

  const handlePauseEvent = () => {
    setIsPlaying(false);
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

  // Report playback progress periodically and when leaving
  useEffect(() => {
    if (!serverUrl || !userId || !accessToken || !itemId) return;

    const reportProgress = async () => {
      const positionTicks = Math.round(currentTime * 10000000);
      await reportPlaybackProgress(
        serverUrl,
        userId,
        itemId,
        accessToken,
        positionTicks,
        !isPlaying,
        playSessionId
      );
    };

    // Report progress every 10 seconds during playback
    const progressInterval = setInterval(() => {
      if (currentTime > 0 && duration > 0) {
        reportProgress();
      }
    }, 10000);

    // Report progress when leaving the page
    const handleBeforeUnload = async () => {
      if (currentTime > 0) {
        const positionTicks = Math.round(currentTime * 10000000);
        try {
          await reportPlaybackProgress(
            serverUrl,
            userId,
            itemId,
            accessToken,
            positionTicks,
            false,
            playSessionId
          );
        } catch {
          // Silent error
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(progressInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Final report when component unmounts
      if (currentTime > 0) {
        reportProgress();
      }
    };
  }, [
    serverUrl,
    userId,
    accessToken,
    itemId,
    currentTime,
    isPlaying,
    duration,
    playSessionId,
  ]);

  const handleSubtitleSelect = (index?: number) => {
    // Save current playback position
    const savedTime = videoRef.current?.currentTime || 0;

    // Note: Subtitle reloading disabled due to CORS. Only update UI state.
    setSubtitleIndex(index);

    // Use HTML5 video element API to change subtitles
    if (videoRef.current) {
      if (index === undefined) {
        // Hide all subtitles
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
          videoRef.current.textTracks[i].mode = "hidden";
        }
      } else {
        // Find and show the subtitle track that matches the selected index
        let selectedTrackIndex = 0;

        // Map subtitle options to their track positions
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
          const track = videoRef.current.textTracks[i];

          // Find the subtitle option that matches this track's label
          const matchingOption = subtitleOptions.find(
            (opt) => opt.label === track.label
          );

          if (matchingOption?.index === index) {
            selectedTrackIndex = i;
            break;
          }
        }

        // Hide all except selected
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
          videoRef.current.textTracks[i].mode =
            i === selectedTrackIndex ? "showing" : "hidden";
        }
      }

      // Restore playback position
      videoRef.current.currentTime = savedTime;
    }

    // Update URL params without triggering a re-render/reset
    const nextParams = new URLSearchParams(searchParams);
    if (index === undefined) {
      nextParams.delete("subtitle");
    } else {
      nextParams.set("subtitle", String(index));
    }
    setSearchParams(nextParams, { replace: true });
    setShowSubtitleMenu(false);
  };

  const handleBack = async () => {
    // Report final progress before leaving
    if (serverUrl && userId && accessToken && itemId && currentTime > 0) {
      const positionTicks = Math.round(currentTime * 10000000);
      await reportPlaybackProgress(
        serverUrl,
        userId,
        itemId,
        accessToken,
        positionTicks,
        false, // Don't mark as paused, just report the position
        playSessionId
      );
    }

    // Check if we came from home resume section
    const fromHome = searchParams.get("from") === "home";
    if (fromHome) {
      navigate("/");
    } else if (itemId) {
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
      ? // For episodes, use the season poster if available, otherwise use episode poster
        item.Type === "Episode" && item.ParentId
        ? getImageUrl(serverUrl, item.ParentId, "Primary", 800, 1200, 90)
        : getImageUrl(serverUrl, item.Id, "Primary", 800, 1200, 90)
      : undefined;

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Video Player */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlayEvent}
        onPause={handlePauseEvent}
        onClick={togglePlayPause}
      >
        Your browser does not support the video tag.
      </video>

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
              className="progress-gradient flex-1"
              style={{
                backgroundSize: `${
                  (currentTime / (duration || 1)) * 100
                }% 100%`,
              }}
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
