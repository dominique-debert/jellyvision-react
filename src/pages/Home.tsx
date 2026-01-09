import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { ItemCard } from "@/components/ItemCard";
import {
  getResumeItems,
  getLatestMedia,
  getUserViews,
} from "@/lib/jellyfin/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface Library {
  Id?: string;
  Name?: string | null;
  CollectionType?: string | null;
}

export default function Home() {
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [resumeItems, setResumeItems] = useState<BaseItemDto[]>([]);
  const [recentMovies, setRecentMovies] = useState<BaseItemDto[]>([]);
  const [recentShows, setRecentShows] = useState<BaseItemDto[]>([]);
  const [recentMusic, setRecentMusic] = useState<BaseItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const moviesScrollRef = useRef<HTMLDivElement>(null);
  const showsScrollRef = useRef<HTMLDivElement>(null);
  const musicScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
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
    const fetchHomeData = async () => {
      if (!serverUrl || !userId || !accessToken) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch resume items (continue watching)
      const resumeResult = await getResumeItems(
        serverUrl,
        userId,
        accessToken,
        12
      );
      if (resumeResult.success) {
        setResumeItems(resumeResult.data);
      }

      // Fetch user libraries
      const viewsResult = await getUserViews(serverUrl, userId, accessToken);
      if (viewsResult.success) {
        const libraries = viewsResult.data as Library[];

        // Find library IDs for each type
        const moviesLibrary = libraries.find(
          (lib) => lib.CollectionType === "movies"
        );
        const showsLibrary = libraries.find(
          (lib) => lib.CollectionType === "tvshows"
        );
        const musicLibrary = libraries.find(
          (lib) => lib.CollectionType === "music"
        );

        // Fetch recently added for each library type
        if (moviesLibrary?.Id) {
          const moviesResult = await getLatestMedia(
            serverUrl,
            userId,
            accessToken,
            moviesLibrary.Id,
            16
          );
          if (moviesResult.success) {
            setRecentMovies(moviesResult.data);
          }
        }

        if (showsLibrary?.Id) {
          const showsResult = await getLatestMedia(
            serverUrl,
            userId,
            accessToken,
            showsLibrary.Id,
            16
          );
          if (showsResult.success) {
            setRecentShows(showsResult.data);
          }
        }

        if (musicLibrary?.Id) {
          const musicResult = await getLatestMedia(
            serverUrl,
            userId,
            accessToken,
            musicLibrary.Id,
            16
          );
          if (musicResult.success) {
            setRecentMusic(musicResult.data);
          }
        }
      }

      setLoading(false);
    };

    fetchHomeData();
  }, [serverUrl, userId, accessToken]);

  return (
    <Layout>
      <main className="container mx-auto px-8 py-8 space-y-12">
        {/* Continue Watching Section */}
        {!loading && resumeItems.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <span className="mr-3">⏯</span> Continue watching
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {resumeItems.map((item) => (
                <ItemCard
                  key={item.Id}
                  item={item}
                  serverUrl={serverUrl!}
                  onPlayClick={() => navigate(`/play/${item.Id}?from=home`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently Added Movies */}
        {!loading && recentMovies.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center">
                <span className="mr-3">🎬</span> Recently added movies
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(moviesScrollRef, "left")}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(moviesScrollRef, "right")}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div
              ref={moviesScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {recentMovies.map((item) => (
                <div key={item.Id} className="flex-none w-48">
                  <ItemCard item={item} serverUrl={serverUrl!} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Added TV Shows */}
        {!loading && recentShows.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center">
                <span className="mr-3">📺</span> Recently added shows
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(showsScrollRef, "left")}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(showsScrollRef, "right")}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div
              ref={showsScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {recentShows.map((item) => (
                <div key={item.Id} className="flex-none w-48">
                  <ItemCard item={item} serverUrl={serverUrl!} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Added Music */}
        {!loading && recentMusic.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center">
                <span className="mr-3">🎵</span> Recently added music
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(musicScrollRef, "left")}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(musicScrollRef, "right")}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div
              ref={musicScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {recentMusic.map((item) => (
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
      </main>
    </Layout>
  );
}
