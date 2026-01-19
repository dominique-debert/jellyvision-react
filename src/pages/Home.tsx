import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getUserViews,
  getResumeItems,
  getNextUpItems,
  getLatestMedia,
} from "@/lib/jellyfin/client";
import { MyLibrarySection } from "@/components/MyLibrarySection";
import { ContinueWatchingSection } from "@/components/ContinueWatchingSection";
import { NextUpSection } from "@/components/NextUpSection";
import { RecentlyAddedMoviesSection } from "@/components/RecentlyAddedMoviesSection";
import { RecentlyAddedShowsSection } from "@/components/RecentlyAddedShowsSection";
import { RecentlyAddedMusicSection } from "@/components/RecentlyAddedMusicSection";

export default function Home() {
  type Library = {
    Id?: string;
    Name?: string | null;
    CollectionType?: string | null;
    ImageTags?: { [key: string]: string } | null;
  };
  type BaseItemDto = { Id?: string };
  const { serverUrl, userId, accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [resumeItems, setResumeItems] = useState<BaseItemDto[]>([]);
  const [nextUpItems, setNextUpItems] = useState<BaseItemDto[]>([]);
  const [recentMovies, setRecentMovies] = useState<BaseItemDto[]>([]);
  const [recentShows, setRecentShows] = useState<BaseItemDto[]>([]);
  const [recentMusic, setRecentMusic] = useState<BaseItemDto[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!serverUrl || !userId || !accessToken) return;
      setLoading(true);
      // Fetch libraries
      const libs = await getUserViews(serverUrl, userId, accessToken);
      if (libs.success) setLibraries(libs.data);

      // Fetch resume/continue watching
      const resume = await getResumeItems(serverUrl, userId, accessToken, 12);
      if (resume.success) setResumeItems(resume.data);

      // Fetch next up
      const nextUp = await getNextUpItems(serverUrl, userId, accessToken, 12);
      if (nextUp.success) setNextUpItems(nextUp.data);

      // Find library IDs for movies, shows, music
      const movieLib = libs.success
        ? libs.data.find((l: Library) => l.CollectionType === "movies")
        : null;
      const showLib = libs.success
        ? libs.data.find((l: Library) => l.CollectionType === "tvshows")
        : null;
      const musicLib = libs.success
        ? libs.data.find((l: Library) => l.CollectionType === "music")
        : null;

      // Fetch recently added for each
      if (movieLib?.Id) {
        const movies = await getLatestMedia(
          serverUrl,
          userId,
          accessToken,
          movieLib.Id,
          12,
        );
        if (movies.success) setRecentMovies(movies.data);
      }
      if (showLib?.Id) {
        const shows = await getLatestMedia(
          serverUrl,
          userId,
          accessToken,
          showLib.Id,
          12,
        );
        if (shows.success) setRecentShows(shows.data);
      }
      if (musicLib?.Id) {
        const music = await getLatestMedia(
          serverUrl,
          userId,
          accessToken,
          musicLib.Id,
          12,
        );
        if (music.success) setRecentMusic(music.data);
      }
      setLoading(false);
    }
    fetchData();
  }, [serverUrl, userId, accessToken]);

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
        libraries={libraries}
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
