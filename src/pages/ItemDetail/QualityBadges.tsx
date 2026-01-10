import { Badge } from "@/components/ui/badge";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export const QualityBadges = ({ item }: { item: BaseItemDto }) => {
  const has4K = item.MediaStreams?.some(
    (s) => s.Type === "Video" && s.Width && s.Width >= 3800
  );
  const hasHDR = item.MediaStreams?.some(
    (s) => s.Type === "Video" && s.VideoRangeType && s.VideoRangeType !== "SDR"
  );

  return (
    <div className="flex gap-2">
      {has4K && (
        <Badge className="bg-base-300 hover:bg-base-content/20 text-base-content font-bold px-3 py-1">
          4K
        </Badge>
      )}
      {hasHDR && (
        <Badge className="bg-base-300 hover:bg-base-content/20 text-base-content font-bold px-3 py-1">
          HDR
        </Badge>
      )}
    </div>
  );
};
