import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { ItemCard } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Film, Tv, Music } from "lucide-react";
import { searchItems } from "@/lib/jellyfin/search";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const { serverUrl, userId, accessToken } = useAuthStore();
  const searchTerm = searchParams.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<BaseItemDto[]>([]);
  const [shows, setShows] = useState<BaseItemDto[]>([]);
  const [music, setMusic] = useState<BaseItemDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const moviesScrollRef = useRef<HTMLDivElement>(null);
  const showsScrollRef = useRef<HTMLDivElement>(null);
  const musicScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right",
  ) => {
    if (ref.current) {
      const scrollAmount = 800;
      const newScrollLeft =
        direction === "left"
          ? ref.current.scrollLeft - scrollAmount
          : ref.current.scrollLeft + scrollAmount;
      ref.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setLoading(false);
        return;
      }

      if (!serverUrl || !userId || !accessToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const result = await searchItems(
        serverUrl,
        userId,
        accessToken,
        searchTerm,
      );

      if (result.success) {
        setMovies(result.data.movies);
        setShows(result.data.shows);
        setMusic(result.data.music);
      } else {
        setError(result.error || "Failed to search");
      }

      setLoading(false);
    };

    performSearch();
  }, [searchTerm, serverUrl, userId, accessToken]);

  if (!searchTerm.trim()) {
    return (
      <div className="flex flex-col gap-8 mt-10">
        <div className="ml-10">
          <p className="text-xl text-base-content/60">
            Enter a search term to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 ml-5 mt-10 pb-30">
      <div className="mr-20 text-left ml-10">
        <h1 className="text-3xl font-light mb-2">Search Results</h1>
        <p className="text-lg text-base-content/60">
          Results for "<span className="font-semibold">{searchTerm}</span>"
        </p>
      </div>

      {loading && (
        <div className="text-center py-12 ml-10">
          <p className="text-xl text-base-content/60">Searching...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-8 ml-10 mr-10">
          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        movies.length === 0 &&
        shows.length === 0 &&
        music.length === 0 && (
          <div className="text-center py-12 ml-10">
            <p className="text-xl text-base-content/60">No results found</p>
          </div>
        )}

      {/* Movies Section */}
      {!loading && movies.length > 0 && (
        <section className="mr-10">
          <div className="flex items-center justify-between ml-10">
            <h2 className="text-3xl font-light flex items-center gap-3">
              <Film className="size-5 inline-block mr-2" /> Movies
            </h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll(moviesScrollRef, "left")}
                className="size-8"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll(moviesScrollRef, "right")}
                className="size-8"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
          <div
            ref={moviesScrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6 ml-10"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {movies.map((item) => (
              <div key={item.Id} className="flex-none w-48">
                <ItemCard item={item} serverUrl={serverUrl!} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TV Shows Section */}
      {!loading && shows.length > 0 && (
        <section className="mr-10">
          <div className="flex items-center justify-between ml-10">
            <h2 className="text-3xl font-light flex items-center gap-3">
              <Tv className="size-5 inline-block mr-2" /> TV Shows
            </h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll(showsScrollRef, "left")}
                className="size-8"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll(showsScrollRef, "right")}
                className="size-8"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
          <div
            ref={showsScrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6 ml-10"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {shows.map((item) => (
              <div key={item.Id} className="flex-none w-48">
                <ItemCard item={item} serverUrl={serverUrl!} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Music Section */}
      {!loading && music.length > 0 && (
        <section className="mr-10">
          <div className="flex items-center justify-between ml-10">
            <h2 className="text-3xl font-light flex items-center gap-3">
              <Music className="size-5 inline-block mr-2" /> Music
            </h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll(musicScrollRef, "left")}
                className="size-8"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll(musicScrollRef, "right")}
                className="size-8"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
          <div
            ref={musicScrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6 ml-10"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {music.map((item) => (
              <div key={item.Id} className="flex-none w-48">
                <ItemCard
                  item={item}
                  serverUrl={serverUrl!}
                  aspectRatio="square"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
