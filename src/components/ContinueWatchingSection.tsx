import { ChevronLeft, ChevronRight, CirclePause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/ItemCard";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useResumeItemsQuery } from "@/lib/jellyfin/client";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export interface ContinueWatchingSectionProps {
  items: BaseItemDto[];
  serverUrl: string;
  loading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right",
  ) => void;
}

export function ContinueWatchingSection({
  scrollRef,
  onScroll,
}: ContinueWatchingSectionProps) {
  const navigate = useNavigate();
  const { serverUrl, userId, accessToken } = useAuthStore();
  const { data: items = [], isLoading } = useResumeItemsQuery(
    serverUrl!,
    userId!,
    accessToken!,
  );

  if (isLoading || items.length === 0) return null;
  return (
    <section className="mt-15 mr-10">
      <div className="flex items-center justify-between ml-16">
        <h2 className="text-3xl font-light flex items-center gap-3">
          <CirclePause className="size-5 inline-block mr-2" /> Continue watching
          <ChevronRight className="size-6 mt-1 inline-block" />
        </h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onScroll(scrollRef, "left")}
            className="size-8 hover:bg-primary/20"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onScroll(scrollRef, "right")}
            className="size-8 hover:bg-primary/20"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex ml-16 gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <div key={item.Id} className="flex-none w-48">
            <ItemCard
              item={item}
              serverUrl={serverUrl!}
              onPlayClick={() => navigate(`/play/${item.Id}?from=home`)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
