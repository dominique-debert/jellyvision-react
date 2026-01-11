import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/ItemCard";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface NextUpSectionProps {
  items: BaseItemDto[];
  serverUrl: string;
  loading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
  ) => void;
}

export function NextUpSection({
  items,
  serverUrl,
  loading,
  scrollRef,
  onScroll,
}: NextUpSectionProps) {
  const navigate = useNavigate();
  if (loading || items.length === 0) return null;
  return (
    <section className="mr-10">
      <div className="flex items-center justify-between ml-16">
        <button
          className="text-2xl font-light flex items-center gap-3 hover:text-primary cursor-pointer"
          onClick={() => navigate("/next-up")}
        >
          <Calendar className="size-5 inline-block mr-2" /> Next Up
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
        className="flex ml-16 gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <div key={item.Id} className="flex-none w-48 aspect-3/2">
            <ItemCard
              item={item}
              serverUrl={serverUrl}
              onPlayClick={() => navigate(`/play/${item.Id}?from=home`)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
