import { useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import {
  fetchNextUp,
  fetchRecentlyAddedMovies,
  fetchRecentlyAddedShows,
  fetchRecentlyAddedMusic,
} from "@/lib/jellyfin/extraMediaFetchers";
import { getUserViews, getResumeItems } from "@/lib/jellyfin/client";
import { MyLibrarySection } from "@/components/MyLibrarySection";
import { ContinueWatchingSection } from "@/components/ContinueWatchingSection";
import { NextUpSection } from "@/components/NextUpSection";
import { RecentlyAddedMoviesSection } from "@/components/RecentlyAddedMoviesSection";
import { RecentlyAddedShowsSection } from "@/components/RecentlyAddedShowsSection";
import { RecentlyAddedMusicSection } from "@/components/RecentlyAddedMusicSection";

export default function Home() {
  const { serverUrl, userId, accessToken } = useAuthStore();

  // Libraries
  const { data: libraries = [], isLoading: librariesLoading } = useQuery({
    queryKey: ["libraries", serverUrl, userId, accessToken],
    queryFn: () =>
      getUserViews(serverUrl!, userId!, accessToken!).then((res) =>
        res.success ? res.data : [],
      ),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });

  // Resume/Continue Watching
  const { data: resumeItems = [], isLoading: resumeLoading } = useQuery({
    queryKey: ["resume", serverUrl, userId, accessToken],
    queryFn: () =>
      getResumeItems(serverUrl!, userId!, accessToken!, 12).then((res) =>
        res.success ? res.data : [],
      ),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });

  // Next Up
  const { data: nextUpItems = [], isLoading: nextUpLoading } = useQuery({
    queryKey: ["nextUp", serverUrl, userId, accessToken],
    queryFn: () => fetchNextUp(serverUrl!, userId!, accessToken!),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });

  // Recently Added Movies
  const { data: recentMovies = [], isLoading: moviesLoading } = useQuery({
    queryKey: ["recentMovies", serverUrl, userId, accessToken],
    queryFn: () => fetchRecentlyAddedMovies(serverUrl!, userId!, accessToken!),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });

  // Recently Added Shows
  const { data: recentShows = [], isLoading: showsLoading } = useQuery({
    queryKey: ["recentShows", serverUrl, userId, accessToken],
    queryFn: () => fetchRecentlyAddedShows(serverUrl!, userId!, accessToken!),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });

  // Recently Added Music
  const { data: recentMusic = [], isLoading: musicLoading } = useQuery({
    queryKey: ["recentMusic", serverUrl, userId, accessToken],
    queryFn: () => fetchRecentlyAddedMusic(serverUrl!, userId!, accessToken!),
    enabled: !!serverUrl && !!userId && !!accessToken,
  });

  const loading =
    librariesLoading ||
    resumeLoading ||
    nextUpLoading ||
    moviesLoading ||
    showsLoading ||
    musicLoading;

  const libraryScrollRef = useRef<HTMLDivElement | null>(null);
  const resumeScrollRef = useRef<HTMLDivElement | null>(null);
  const nextUpScrollRef = useRef<HTMLDivElement | null>(null);
  const moviesScrollRef = useRef<HTMLDivElement | null>(null);
  const showsScrollRef = useRef<HTMLDivElement | null>(null);
  const musicScrollRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="flex flex-col gap-10 mt-10 mb-30">
      <MyLibrarySection
        items={libraries}
        serverUrl={serverUrl!}
        loading={loading}
        scrollRef={libraryScrollRef as React.RefObject<HTMLDivElement>}
        onScroll={scroll}
      />
      <ContinueWatchingSection
        items={resumeItems}
        serverUrl={serverUrl!}
        loading={loading}
        scrollRef={resumeScrollRef as React.RefObject<HTMLDivElement>}
        onScroll={scroll}
      />
      <NextUpSection
        items={nextUpItems}
        serverUrl={serverUrl!}
        loading={loading}
        scrollRef={nextUpScrollRef as React.RefObject<HTMLDivElement>}
        onScroll={scroll}
      />
      <RecentlyAddedMoviesSection
        items={recentMovies}
        serverUrl={serverUrl!}
        loading={loading}
        scrollRef={moviesScrollRef as React.RefObject<HTMLDivElement>}
        onScroll={scroll}
      />
      <RecentlyAddedShowsSection
        items={recentShows}
        serverUrl={serverUrl!}
        loading={loading}
        scrollRef={showsScrollRef as React.RefObject<HTMLDivElement>}
        onScroll={scroll}
      />
      <RecentlyAddedMusicSection
        items={recentMusic}
        serverUrl={serverUrl!}
        loading={loading}
        scrollRef={musicScrollRef as React.RefObject<HTMLDivElement>}
        onScroll={scroll}
      />
    </div>
  );
}
