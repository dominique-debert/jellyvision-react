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
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const barsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prepare bar elements
    barsRef.current = bands.map((_, i) => {
      let el = container.children[i] as HTMLDivElement | undefined;
      if (!el) {
        el = document.createElement("div");
        const colorClass = [
          "bg-primary",
          "bg-secondary",
          "bg-accent",
          "bg-info",
          "bg-warning",
        ][i % 5];
        el.className = `h-2 w-2 rounded-sm ${colorClass}`;
        container.appendChild(el);
      }
      return el;
    });

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
          bar.style.height = "4%";
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
      ref={containerRef}
      className={
        "flex items-end gap-0.5 h-6 w-12" + (className ? ` ${className}` : "")
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
        return <div key={i} className={`h-2 w-2 rounded-sm ${colorClass}`} />;
      })}
    </div>
  );
};

export default EqualizerBars;
