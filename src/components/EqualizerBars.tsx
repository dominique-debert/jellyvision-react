import React, { useEffect, useRef } from "react";

export interface EqualizerBarsProps {
  getAnalyser: () => AnalyserNode | null;
  isPlaying: boolean;
  bands?: Array<{ min: number; max: number }>;
  className?: string;
}

// Default 8 bands: wider frequency coverage
const DEFAULT_BANDS = [
  { min: 20, max: 100 },
  { min: 100, max: 250 },
  { min: 250, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 2000 },
  { min: 2000, max: 4000 },
  { min: 4000, max: 8000 },
  { min: 8000, max: 16000 },
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
    const run = () => {
      const analyser = getAnalyser();
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
        "flex items-end gap-1 h-6 w-24" + (className ? ` ${className}` : "")
      }
    >
      {bands.map((_, i) => {
        return (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className="flex-1 bg-white/60"
            style={{ minHeight: "4%" }}
          />
        );
      })}
    </div>
  );
};

export default EqualizerBars;
