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
}: FloatingAudioBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="sticky -ml-13 bottom-20 backdrop-blur-lg py-2 pl-91 pr-7 z-50">
      <div className="flex items-center gap-6">
        {/* Track Info (far left) */}
        <div className="w-64 shrink-0">
          <p className="text-sm font-medium text-white truncate">
            {trackName || "Track name"}
          </p>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-4 pr-4 pl-4 border-r border-l border-gray-600">
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
            className="w-32 h-1 rounded-full bg-gray-700 accent-primary/40"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
            onClick={onSkipBack}
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            className="size-15 rounded-full hover:bg-white/30 hover:scale-110 flex items-center justify-center transition-all cursor-pointer shadow-2xl border-2 border-white/20"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="size-6 text-white/60 fill-white/60" />
            ) : (
              <Play className="size-6 text-white/60 fill-white/60" />
            )}
          </button>

          <button
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
            onClick={onSkipForward}
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* Repeat */}
          <button
            className={`p-1.5 rounded transition-colors ml-2 ${
              repeatMode !== "off"
                ? "bg-primary/40/20 text-amber-400"
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
        </div>

        {/* Progress Bar */}
        <div className="flex w-24 items-center gap-6 flex-1 border-l border-slate-600">
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
            className="progress-gradient w-24 h-1 flex-1"
            style={{
              backgroundColor: "rgb(55, 65, 81)",
              backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%`,
            }}
          />

          <span className="text-xs text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
