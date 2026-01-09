import React, { useEffect, useRef } from "react";

export interface EqualizerBarsProps {
  getAnalyser: () => AnalyserNode | null;
  isPlaying: boolean;
  bands?: Array<{ min: number; max: number }>;
  className?: string;
}

// Default 5 bands: bass, low-mid, mid, upper-mid, treble
const DEFAULT_BANDS = [
  { min: 20, max: 250 },
  { min: 250, max: 500 },
  { min: 500, max: 2000 },
  { min: 2000, max: 4000 },
  { min: 4000, max: 16000 },
];

export const EqualizerBars: React.FC<EqualizerBarsProps> = ({
  getAnalyser,
  isPlaying,
  bands = DEFAULT_BANDS,
  className,
}) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("[EqualizerBars] mounted, isPlaying:", isPlaying);
    const run = () => {
      const analyser = getAnalyser();
      console.log("[EqualizerBars RAF] analyser:", !!analyser, "isPlaying:", isPlaying);
      if (analyser && isPlaying) {
        const fftSize = analyser.frequencyBinCount;
        const data = new Uint8Array(fftSize);
        analyser.getByteFrequencyData(data);
        const sampleRate = analyser.context.sampleRate;
        const nyquist = sampleRate / 2;
        const binSize = nyquist / fftSize;

        barsRef.current.forEach((bar, idx) => {
          if (!bar) return;
          const band = bands[idx];
          const startBin = Math.max(0, Math.floor(band.min / binSize));
          const endBin = Math.min(fftSize - 1, Math.floor(band.max / binSize));
          let sum = 0;
          let count = 0;
          for (let i = startBin; i <= endBin; i++) {
            sum += data[i];
            count++;
          }
          const avg = count > 0 ? sum / count : 0;
          // Map 0-255 to 0-100% height
          const heightPct = Math.min(100, (avg / 255) * 100);
          bar.style.height = `${Math.max(4, heightPct)}%`;
        });
      } else {
        // No fallback animation: keep minimal height when not playing or no analyser
        barsRef.current.forEach((bar) => {
          if (bar) bar.style.height = "4%";
        });
      }
      rafRef.current = requestAnimationFrame(run);
    };

    rafRef.current = requestAnimationFrame(run);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, bands, getAnalyser]);

  return (
    <div
      className={
        "flex items-end gap-0.5 h-6 w-16" + (className ? ` ${className}` : "")
      }
    >
      {bands.map((_, i) => {
        const colorClass = [
          "bg-primary",
          "bg-secondary",
          "bg-accent",
          "bg-info",
          "bg-warning",
        ][i % 5];
        return (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className={`flex-1 rounded-sm ${colorClass}`}
            style={{ minHeight: "4%" }}
          />
        );
      })}
    </div>
  );
};

export default EqualizerBars;
