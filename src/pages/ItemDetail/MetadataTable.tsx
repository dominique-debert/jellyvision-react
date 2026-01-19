import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models";
import { formatRuntime } from "@/lib/utils";

export const MetadataTable = ({ item }: { item: BaseItemDto }) => (
  <div className="grid grid-cols-4 gap-6 text-sm">
    <div className="flex flex-col items-start">
      <div className="text-white/70 font-medium mb-1">Date</div>
      <div className="text-white">
        {item.ProductionYear || item.PremiereDate
          ? new Date(
              item.PremiereDate || `${item.ProductionYear}-01-01`,
            ).getFullYear()
          : "-"}
      </div>
    </div>
    <div className="flex flex-col items-start">
      <div className="text-white/70 font-medium mb-1">Duration</div>
      <div className="text-white">
        {item.RunTimeTicks ? formatRuntime(item.RunTimeTicks) : "-"}
      </div>
    </div>

    {item.Type === BaseItemKind.Audio ? (
      <>
        <div className="flex flex-col items-start">
          <div className="text-white/70 font-medium mb-1">Certification</div>
          <div className="text-white">{item.OfficialRating || "-"}</div>
        </div>
        <div className="flex flex-col items-start">
          <div className="text-white/70 font-medium mb-1">Genre</div>
          <div className="text-white">{item.Genres?.join(", ") || "-"}</div>
        </div>
      </>
    ) : null}
  </div>
);
