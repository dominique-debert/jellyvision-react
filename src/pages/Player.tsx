import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
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

  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const playSessionIdRef = useRef<string>("");

  // Initialize session ID on first render only
  useEffect(() => {
    playSessionIdRef.current =
      Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }, []);

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
        console.log("Item loaded:", result.data.Name);
        console.log("Item UserData:", result.data.UserData);
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

  // getStreamUrl wrapped in useCallback to avoid redeclaration and dependency issues
  const getStreamUrl = useCallback(
    (subtitle?: number) => {
      if (!serverUrl || !itemId || !accessToken) return "";
      // Use Jellyfin's stream endpoint with transcoding parameters
      const params = new URLSearchParams();
      params.set("api_key", accessToken);
      params.set("PlaySessionId", playSessionIdRef.current);
      // Force transcoding to web-compatible formats
      params.set("VideoCodec", "h264");
      params.set("AudioCodec", "aac,mp3");
      params.set("AudioStreamIndex", "1");
      params.set("VideoStreamIndex", "0");
      params.set("Level", "41");
      params.set("MaxFramerate", "30");
      params.set("MaxWidth", "1920");
      params.set("MaxHeight", "1080");
      params.set("VideoBitrate", "8000000");
      params.set("AudioBitrate", "320000");
      params.set("TranscodeReasons", "VideoCodecNotSupported");
      if (subtitle !== undefined) {
        params.set("SubtitleStreamIndex", String(subtitle));
      }
      // In development (localhost), use the Vite proxy; otherwise use the server URL
      const baseUrl =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
          ? "/jellyfin"
          : serverUrl;
      return `${baseUrl}/Videos/${itemId}/stream?${params.toString()}`;
    },
    [serverUrl, itemId, accessToken]
  );

  // Initialize video player with stream
  useEffect(() => {
    const initializePlayer = async () => {
      if (!videoRef.current || !item || !itemId) return;

      try {
        const streamUrl = getStreamUrl();
        console.log("Loading stream:", streamUrl);

        // Update the source element
        const sourceElement = videoRef.current.querySelector("source");
        if (sourceElement) {
          sourceElement.src = streamUrl;
        }

        // Reload the video element
        videoRef.current.load();
      } catch (e) {
        console.error("Error initializing player:", e);
      }
    };

    if (item && !loading) {
      initializePlayer();
    }
  }, [item, loading, itemId, getStreamUrl]);

  // Unmute video once it starts playing (for autoplay)
  useEffect(() => {
    if (!videoRef.current) return;

    const handleCanPlay = () => {
      // Unmute after a brief delay to allow autoplay to start
      setTimeout(() => {
        if (videoRef.current && videoRef.current.muted) {
          videoRef.current.muted = false;
          videoRef.current.volume = volume;
        }
      }, 100);
    };

    const video = videoRef.current;
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [volume]);

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

      // Clear existing subtitle tracks
      for (let i = videoRef.current!.textTracks.length - 1; i >= 0; i--) {
        const track = videoRef.current!.textTracks[i];
        if (track.kind === "subtitles") {
          const trackElement = Array.from(
            videoRef.current!.querySelectorAll("track")
          ).find((t) => t.label === track.label);
          trackElement?.remove();
        }
      }

      // Load first subtitle track
      if (subtitleOptions.length > 0 && serverUrl && itemId && accessToken) {
        try {
          const subtitleIndex = subtitleOptions[0].index;
          const subtitleLabel = subtitleOptions[0].label;
          console.log(
            `Attempting to load subtitle: "${subtitleLabel}" (index=${subtitleIndex})`
          );

          // Get PlaybackInfo to fetch DeliveryUrl for the subtitle
          // This is how jellyfin-web handles subtitles
          console.log("Fetching PlaybackInfo to get subtitle DeliveryUrl...");
          // In development (localhost), use the Vite proxy; otherwise use the server URL
          const baseUrl =
            typeof window !== "undefined" &&
            window.location.hostname === "localhost"
              ? "/jellyfin"
              : serverUrl;
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
            console.warn(
              `Failed to fetch PlaybackInfo (${playbackInfoResponse.status})`
            );
            return;
          }

          const playbackInfo = await playbackInfoResponse.json();
          const playbackMediaStreams =
            playbackInfo.MediaSources?.[0]?.MediaStreams || [];
          const playbackSubtitle = playbackMediaStreams.find(
            (s: Record<string, unknown>) =>
              s.Type === "Subtitle" && s.Index === subtitleIndex
          );

          if (!playbackSubtitle?.DeliveryUrl) {
            console.warn(
              `No DeliveryUrl found for subtitle index ${subtitleIndex}`
            );
            return;
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

          console.log(
            `Fetching subtitle JSON from: ${subtitleUrl.substring(0, 100)}...`
          );

          // Fetch the subtitle JSON content (not VTT)
          const response = await fetch(subtitleUrl);

          if (!response.ok) {
            console.warn(
              `Failed to fetch subtitle (${response.status}): ${response.statusText}`
            );
            return;
          }

          const subtitleData = await response.json();
          const trackEvents = subtitleData.TrackEvents || [];
          console.log(
            `✓ Successfully loaded ${trackEvents.length} subtitle events`
          );

          if (trackEvents.length === 0) {
            console.warn("No subtitle events found");
            return;
          }

          // Remove any existing subtitle tracks to avoid duplicates
          for (let i = videoRef.current!.textTracks.length - 1; i >= 0; i--) {
            const track = videoRef.current!.textTracks[i];
            if (track.kind === "subtitles") {
              // Clear the cues from the track
              for (let j = track.cues!.length - 1; j >= 0; j--) {
                track.removeCue(track.cues![j]);
              }
            }
          }

          // Create a track element
          const track = videoRef.current!.addTextTrack(
            "subtitles",
            subtitleLabel
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
              // Position subtitles 20px higher by adjusting the line property
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (cue as any).line = -1;
              track.addCue(cue);
            }
          }

          // Show the track
          track.mode = "showing";
          console.log("✓ Subtitles loaded and visible");
        } catch (e) {
          console.error("Error loading subtitles:", e);
        }
      }
    };

    loadSubtitles();
  }, [item, subtitleOptions, serverUrl, itemId, accessToken, getStreamUrl]);

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
        console.log(`✓ Resuming from ${formatTime(resumeSeconds)}`);
      } else {
        console.log(
          "No PlaybackPositionTicks found in UserData:",
          item.UserData
        );
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
        playSessionIdRef.current
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
            playSessionIdRef.current
          );
        } catch (e) {
          console.error("Failed to report progress on unload:", e);
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
  ]);

  const handleSubtitleSelect = (index?: number) => {
    // Note: Subtitle reloading disabled due to CORS. Only update UI state.
    setSubtitleIndex(index);

    // Use HTML5 video element API to change subtitles
    if (videoRef.current) {
      if (index === undefined) {
        // Hide all subtitles
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
          videoRef.current.textTracks[i].mode = "hidden";
        }
      } else if (index < videoRef.current.textTracks.length) {
        // Hide all except selected
        for (let i = 0; i < videoRef.current.textTracks.length; i++) {
          videoRef.current.textTracks[i].mode =
            i === index ? "showing" : "hidden";
        }
      }
    }

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
      console.log(
        `Reporting final position: ${formatTime(
          currentTime
        )} (${positionTicks} ticks)`
      );
      await reportPlaybackProgress(
        serverUrl,
        userId,
        itemId,
        accessToken,
        positionTicks,
        false, // Don't mark as paused, just report the position
        playSessionIdRef.current
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
        {item && itemId && <source src={getStreamUrl()} type="video/mp4" />}
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
