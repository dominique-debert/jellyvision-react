import { Music, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/ItemCard";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface RecentlyAddedMusicSectionProps {
  items: BaseItemDto[];
  serverUrl: string;
  loading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
  ) => void;
}

export function RecentlyAddedMusicSection({
  items,
  serverUrl,
  loading,
  scrollRef,
  onScroll,
}: RecentlyAddedMusicSectionProps) {
  const navigate = useNavigate();
  if (loading || items.length === 0) return null;
  return (
    <section className="mr-10">
      <div className="flex items-center justify-between ml-16">
        <button
          className="text-3xl font-light flex items-center gap-3 hover:underline hover:text-primary"
          onClick={() => navigate("/recently-added/music")}
        >
          <Music className="size-5 inline-block mr-2" /> Recently added in Music
          <ChevronRight className="size-6 mt-1 inline-block" />
        </button>
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
        className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6 ml-16"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <div key={item.Id} className="flex-none w-48">
            <ItemCard
              item={item}
              serverUrl={serverUrl}
              aspectRatio="square"
              onPlayClick={() => navigate(`/item/${item.Id}?autoplay=true`)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
