import {} from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  X,
} from "lucide-react";

export type RepeatMode = "off" | "all" | "one";

interface FloatingAudioBarProps {
  trackName: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  repeatMode: RepeatMode;
  onSeek: (value: number) => void;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onVolumeChange: (value: number) => void;
  onToggleRepeat: () => void;
  onClose: () => void;
}

export function FloatingAudioBar({
  trackName,
  currentTime,
  duration,
  isPlaying,
  volume,
  repeatMode,
  onSeek,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onVolumeChange,
  onToggleRepeat,
  onClose,
}: FloatingAudioBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="sticky bottom-0 backdrop-blur-lg px-6 py-4 z-50">
      <div className="flex items-center gap-4">
        {/* Track Info (far left) */}
        <div className="w-64 shrink-0">
          <p className="text-sm font-medium text-white truncate">
            {trackName || "Track name"}
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
            onChange={(e) => onSeek(Number(e.target.value))}
            className="h-1 flex-1 rounded-full bg-gray-700"
            style={{
              accentColor: "transparent",
              backgroundImage:
                "linear-gradient(to right, rgb(168, 85, 247), rgb(59, 130, 246), rgb(6, 182, 212))",
              backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%`,
              backgroundRepeat: "no-repeat",
              backgroundColor: "rgb(55, 65, 81)",
            }}
          />

          <span className="text-xs text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
            onClick={onSkipBack}
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            className="p-1.5 bg-amber-500 hover:bg-amber-600 rounded transition-colors text-white"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-white" />
            ) : (
              <Play className="h-4 w-4 fill-white" />
            )}
          </button>

          <button
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
            onClick={onSkipForward}
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
              onChange={(e) => onVolumeChange(Number(e.target.value))}
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
            onClick={onToggleRepeat}
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
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
