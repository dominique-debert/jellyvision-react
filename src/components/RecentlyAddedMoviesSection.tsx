import { Clapperboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/ItemCard";
import { useAuthStore } from "@/store/useAuthStore";
import { useRecentlyAddedMoviesQuery } from "@/lib/jellyfin/extraMediaFetchers";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export interface RecentlyAddedMoviesSectionProps {
  items: BaseItemDto[];
  serverUrl: string;
  loading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right",
  ) => void;
}

export function RecentlyAddedMoviesSection({
  scrollRef,
  onScroll,
}: RecentlyAddedMoviesSectionProps) {
  const navigate = useNavigate();
  const { serverUrl, userId, accessToken } = useAuthStore();
  const { data: items = [], isLoading } = useRecentlyAddedMoviesQuery(
    serverUrl!,
    userId!,
    accessToken!,
  );

  if (isLoading || items.length === 0) return null;
  return (
    <section className="mr-10">
      <div className="flex items-center justify-between ml-16">
        <button
          className="text-2xl font-light flex items-center gap-3 hover:text-primary cursor-pointer"
          onClick={() => navigate("/recently-added/movies")}
        >
          <Clapperboard className="size-5 inline-block mr-2" /> Recently added
          in Movies
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
            <ItemCard item={item} serverUrl={serverUrl!} />
          </div>
        ))}
      </div>
    </section>
  );
}
