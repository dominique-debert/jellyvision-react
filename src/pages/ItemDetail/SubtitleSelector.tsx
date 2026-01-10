import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export const SubtitleSelector = ({
  item,
  selectedSubtitle,
  onSubtitleChange,
}: {
  item: BaseItemDto;
  selectedSubtitle: number | undefined;
  onSubtitleChange: (subtitle: number | undefined) => void;
}) => {
  const subtitleStreams =
    item?.MediaStreams?.filter(
      (s) => s.Type === "Subtitle" && s.Index !== undefined
    ) || [];

  if (subtitleStreams.length === 0) return null;

  return (
    <div className="flex items-center gap-3 text-sm text-white">
      <span className="text-white/70 font-medium">Subtitles:</span>
      <select
        value={selectedSubtitle ?? "none"}
        onChange={(e) =>
          onSubtitleChange(
            e.target.value === "none" ? undefined : Number(e.target.value)
          )
        }
        className="bg-base-200 border border-base-300 rounded px-3 py-2 text-base-content text-sm"
      >
        <option value="none">None</option>
        {subtitleStreams.map((s) => (
          <option key={s.Index} value={s.Index}>
            {s.Language || s.DisplayTitle || `Subtitle ${s.Index}`}
            {s.IsForced ? " (Forced)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
};
