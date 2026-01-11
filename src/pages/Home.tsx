import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { ItemCard } from "@/components/ItemCard";
import {
  getResumeItems,
  getLatestMedia,
  getUserViews,
  getNextUpItems,
  getImageUrl,
} from "@/lib/jellyfin/client";
import { Button } from "@/components/ui/button";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

interface Library {
  Id?: string;
  Name?: string | null;
  CollectionType?: string | null;
  PrimaryImageTag?: string | null;
}

import {
  CirclePause,
  Clapperboard,
  Drama,
  Music,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [resumeItems, setResumeItems] = useState<BaseItemDto[]>([]);
  const [recentMovies, setRecentMovies] = useState<BaseItemDto[]>([]);
  const [recentShows, setRecentShows] = useState<BaseItemDto[]>([]);
  const [recentMusic, setRecentMusic] = useState<BaseItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUpItems, setNextUpItems] = useState<BaseItemDto[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const libraryScrollRef = useRef<HTMLDivElement>(null);
  const moviesScrollRef = useRef<HTMLDivElement>(null);
  const showsScrollRef = useRef<HTMLDivElement>(null);
  const musicScrollRef = useRef<HTMLDivElement>(null);
  const resumeScrollRef = useRef<HTMLDivElement>(null);
  const nextUpScrollRef = useRef<HTMLDivElement>(null);

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

      // Fetch Next Up items
      const nextUpResult = await getNextUpItems(
        serverUrl,
        userId,
        accessToken,
        12
      );
      if (nextUpResult.success) {
        setNextUpItems(nextUpResult.data);
      }

      // Fetch user libraries
      const viewsResult = await getUserViews(serverUrl, userId, accessToken);
      if (viewsResult.success) {
        const libs = viewsResult.data as Library[];
        setLibraries(libs);

        // Find library IDs for each type
        const moviesLibrary = libs.find(
          (lib) => lib.CollectionType === "movies"
        );
        const showsLibrary = libs.find(
          (lib) => lib.CollectionType === "tvshows"
        );
        const musicLibrary = libs.find((lib) => lib.CollectionType === "music");

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
      <div className="flex flex-col gap-10 mt-10 mb-30">
        {/* My Library Section */}
        {!loading && libraries.length > 0 && (
          <section className="mr-10">
            <div className="flex items-center justify-between ml-16">
              <h2 className="text-3xl font-light flex items-center gap-3">
                <ChevronRight className="size-5 inline-block mr-2" /> My Library
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(libraryScrollRef, "left")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(libraryScrollRef, "right")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
            <div
              ref={libraryScrollRef}
              className="flex ml-16 gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {libraries.map((lib) => {
                const posterUrl =
                  lib.PrimaryImageTag && lib.Id && serverUrl
                    ? getImageUrl(serverUrl, lib.Id, "Primary", 400, 600)
                    : null;
                return (
                  <div key={lib.Id} className="flex-none w-48">
                    <div
                      className="card bg-base-200 shadow-md cursor-pointer h-full flex flex-col items-center justify-center p-0 hover:bg-primary/10 transition overflow-hidden"
                      onClick={() => lib.Id && navigate(`/library/${lib.Id}`)}
                    >
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={lib.Name || "Library poster"}
                          className="w-full h-64 object-cover object-center mb-2"
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-base-300 text-base-content/40">
                          No Image
                        </div>
                      )}
                      <div className="p-4 w-full flex flex-col items-center">
                        <div className="text-xl font-semibold text-center mb-2">
                          {lib.Name}
                        </div>
                        <div className="text-sm text-base-content/70 text-center capitalize">
                          {lib.CollectionType}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {/* Continue Watching Section */}
        {!loading && resumeItems.length > 0 && (
          <section className="mr-10">
            <div className="flex items-center justify-between ml-16">
              <h2 className="text-3xl font-light flex items-center gap-3">
                <CirclePause className="size-5 inline-block mr-2" /> Continue
                watching <ChevronRight className="size-6 mt-1 inline-block" />
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(resumeScrollRef, "left")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(resumeScrollRef, "right")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
            <div
              ref={resumeScrollRef}
              className="flex ml-16 gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {resumeItems.map((item) => (
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
        )}

        {/* Next Up Section */}
        {!loading && nextUpItems.length > 0 && (
          <section className="mr-10">
            <div className="flex items-center justify-between ml-16">
              <h2 className="text-3xl font-light flex items-center gap-3">
                <Calendar className="size-5 inline-block mr-2" /> Next Up
                <ChevronRight className="size-6 mt-1 inline-block" />
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(nextUpScrollRef, "left")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(nextUpScrollRef, "right")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
            <div
              ref={nextUpScrollRef}
              className="flex ml-16 gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {nextUpItems.map((item) => (
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
        )}

        {/* Recently Added Movies */}
        {!loading && recentMovies.length > 0 && (
          <section className="mr-10">
            <div className="flex items-center justify-between ml-16">
              <h2 className="text-3xl font-light flex items-center gap-3">
                <Clapperboard className="size-5 inline-block mr-2" /> Recently
                added in Movies{" "}
                <ChevronRight className="size-6 mt-1 inline-block" />
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(moviesScrollRef, "left")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(moviesScrollRef, "right")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
            <div
              ref={moviesScrollRef}
              className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6 ml-16"
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
          <section className="mr-10">
            <div className="flex items-center justify-between ml-16">
              <h2 className="text-3xl font-light flex items-center gap-3">
                <Drama className="size-5 inline-block mr-2" /> Recently added in
                TV Shows <ChevronRight className="size-6 mt-1 inline-block" />
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(showsScrollRef, "left")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(showsScrollRef, "right")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
            <div
              ref={showsScrollRef}
              className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6 ml-16"
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
          <section className="mr-10">
            <div className="flex items-center justify-between ml-16">
              <h2 className="text-3xl font-light flex items-center gap-3">
                <Music className="size-5 inline-block mr-2" /> Recently added in
                Music <ChevronRight className="size-6 mt-1 inline-block" />
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(musicScrollRef, "left")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll(musicScrollRef, "right")}
                  className="size-8 hover:bg-primary/20"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
            <div
              ref={musicScrollRef}
              className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6 ml-16"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {recentMusic.map((item) => (
                <div key={item.Id} className="flex-none w-48">
                  <ItemCard
                    item={item}
                    serverUrl={serverUrl!}
                    aspectRatio="square"
                    onPlayClick={() =>
                      navigate(`/item/${item.Id}?autoplay=true`)
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
