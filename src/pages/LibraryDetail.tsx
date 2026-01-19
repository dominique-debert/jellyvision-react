import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import {
  getLibraryItems,
  getImageUrl,
  getAllAlbumsInLibrary,
  getItem,
} from "@/lib/jellyfin/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Play,
  CircleCheck,
  ChevronDown,
  ArrowDownUp,
  Clapperboard,
  Drama,
  Music,
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface MediaItem {
  Id?: string;
  Name?: string | null;
  Type?: string;
  ImageTags?: { [key: string]: string } | null;
  ProductionYear?: number | null;
  ChildCount?: number;
  RecursiveItemCount?: number;
  UserData?: {
    Played?: boolean;
  };
}

export default function LibraryDetail() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { libraryId } = useParams<{ libraryId: string }>();
  const getSortKey = useCallback(
    (key: string) => `librarySort_${libraryId}_${key}`,
    [libraryId],
  );
  const [sortBy, setSortBy] = useState(() => {
    if (!libraryId) return "Name";
    return localStorage.getItem(`librarySort_${libraryId}_By`) || "Name";
  });
  const [sortOrder, setSortOrder] = useState(() => {
    if (!libraryId) return "Ascending";
    return (
      localStorage.getItem(`librarySort_${libraryId}_Order`) || "Ascending"
    );
  });
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 60;

  useEffect(() => {
    if (!libraryId) return;
    localStorage.setItem(getSortKey("By"), sortBy);
    localStorage.setItem(getSortKey("Order"), sortOrder);
  }, [sortBy, sortOrder, libraryId, getSortKey]);

  const {
    data: libraryInfo,
    isLoading: libraryInfoLoading,
    isError: libraryInfoError,
  } = useQuery({
    queryKey: ["libraryInfo", serverUrl, userId, accessToken, libraryId],
    queryFn: async () => {
      if (!serverUrl || !userId || !accessToken || !libraryId) return null;
      const result = await getItem(serverUrl, userId, libraryId, accessToken);
      if (result.success && result.data) return result.data;
      throw new Error("Failed to fetch library info");
    },
    enabled: !!serverUrl && !!userId && !!accessToken && !!libraryId,
  });

  const libraryType = libraryInfo?.CollectionType || null;

  const {
    data: itemsData,
    isLoading: itemsLoading,
    isError: itemsError,
  } = useQuery({
    queryKey: [
      "libraryItems",
      serverUrl,
      userId,
      accessToken,
      libraryId,
      currentPage,
      sortBy,
      sortOrder,
      libraryType,
    ],
    queryFn: async () => {
      if (!serverUrl || !userId || !accessToken || !libraryId)
        return { items: [], totalCount: 0 };
      const apiSortBy = sortBy === "DateAdded" ? "DateCreated" : sortBy;
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

      if (libraryType === "music") {
        const albumsResult = await getAllAlbumsInLibrary(
          serverUrl,
          userId,
          libraryId,
          accessToken,
          startIndex,
          ITEMS_PER_PAGE,
          apiSortBy,
          sortOrder,
        );
        if (albumsResult.success) {
          return {
            items: albumsResult.data as MediaItem[],
            totalCount: albumsResult.totalCount,
          };
        }
        throw new Error("Failed to fetch albums");
      } else {
        const includeTypes = libraryType === "tvshows" ? ["Series"] : undefined;
        const itemsResult = await getLibraryItems(
          serverUrl,
          userId,
          libraryId,
          accessToken,
          startIndex,
          ITEMS_PER_PAGE,
          includeTypes,
          apiSortBy,
          sortOrder,
        );
        if (itemsResult.success) {
          return {
            items: itemsResult.data as MediaItem[],
            totalCount: itemsResult.totalCount,
          };
        }
        throw new Error("Failed to fetch items");
      }
    },
    enabled:
      !!serverUrl && !!userId && !!accessToken && !!libraryId && !!libraryType,
  });

  const { items = [], totalCount = 0 } = (itemsData as {
    items: MediaItem[];
    totalCount: number;
  }) ?? { items: [], totalCount: 0 };
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (libraryInfoLoading || itemsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }
  if (libraryInfoError || itemsError) {
    return (
      <div className="alert alert-error mt-8 mx-auto max-w-xl">
        <span>Failed to load library.</span>
      </div>
    );
  }

  return (
    <div>
      <header className="border-b border-base-300 pb-0 pt-4">
        <div className="flex w-full justify-between items-center mb-4">
          <h1 className="inline-flex items-center gap-4 text-3xl m-0 p-0 font-light w-full text-left mb-4 mt-6 ml-15">
            {libraryType === "music" ? (
              <Music className="size-6 pt-1" />
            ) : libraryType === "tvshows" ? (
              <Drama className="size-6 pt-1" />
            ) : (
              <Clapperboard />
            )}
            {libraryType === "music"
              ? "Music"
              : libraryType === "tvshows"
                ? "TV Shows"
                : "Movies"}
          </h1>
          <p className="text-sm text-right mr-17 text-muted-foreground w-full">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="mx-auto pl-15 pr-20 flex items-center justify-between">
          <div className="flex items-center gap-4 mb-6">
            <button
              className="btn btn-md btn-primary gap-2"
              onClick={() => navigate("/")}
              type="button"
            >
              <ArrowLeft className="size-6" />
              Back
            </button>
            <div className="relative">
              <button
                className="btn btn-md btn-ghost gap-2"
                onClick={() => setShowDropdown((v) => !v)}
              >
                <span>
                  <ArrowDownUp className="size-5" />
                </span>
                <ChevronDown className="size-5" />
              </button>
              {showDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-base-200 rounded-xl shadow-lg z-50 p-4 flex flex-col gap-4">
                  <div>
                    <div className="font-semibold mb-2">Sort By</div>
                    <div className="flex flex-col gap-1">
                      {[
                        { label: "Name", value: "Name" },
                        {
                          label: "Community Rating",
                          value: "CommunityRating",
                        },
                        { label: "Date Added", value: "DateAdded" },
                        { label: "Release Date", value: "ReleaseDate" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="sortBy"
                            value={option.value}
                            checked={sortBy === option.value}
                            onChange={() => setSortBy(option.value)}
                            className="radio radio-sm"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Sort Order</div>
                    <div className="flex flex-col gap-1">
                      {["Ascending", "Descending"].map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="sortOrder"
                            value={option}
                            checked={sortOrder === option}
                            onChange={() => setSortOrder(option)}
                            className="radio radio-sm"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="ml-10 mr-10 px-4 py-8 pt-4 pb-15 overflow-y-auto h-[calc(100vh-20rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No items found in this library
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
            {items.map((item) => (
              <div
                key={item.Id}
                className="cursor-pointer group"
                onClick={() => navigate(`/item/${item.Id}`)}
              >
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <div
                    className={`${
                      libraryType === "music" ? "aspect-square" : "aspect-2/3"
                    } bg-muted overflow-hidden`}
                  >
                    {item.Id && item.ImageTags?.["Primary"] && serverUrl ? (
                      <img
                        src={getImageUrl(
                          serverUrl,
                          item.Id,
                          "Primary",
                          400,
                          600,
                          85,
                        )}
                        alt={item.Name || "Media item"}
                        className="w-full h-full rounded-xl border border-white/10 object-cover transition-transform group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {item.Type === "Movie"
                          ? "🎬"
                          : item.Type === "Series"
                            ? "📺"
                            : item.Type === "Audio"
                              ? "🎵"
                              : "📁"}
                      </div>
                    )}
                    {item.UserData?.Played && libraryType !== "music" && (
                      <div className="absolute top-2 right-2 rounded-full p-1 shadow-lg">
                        <CircleCheck className="size-6  text-green-700/90" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between rounded-lg p-4">
                      <div></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (libraryType === "music") {
                            navigate(`/item/${item.Id}?autoplay=true`);
                          } else {
                            navigate(`/play/${item.Id}`);
                          }
                        }}
                        className="h-20 w-20 rounded-full hover:bg-white/30 hover:scale-110 flex items-center justify-center transition-all cursor-pointer shadow-2xl border-2 border-white/20"
                      >
                        <Play className="h-10 w-10 text-white/60 fill-white/60" />
                      </button>
                      <div className="w-full">
                        <h3 className="font-semibold text-lg text-white text-center line-clamp-2">
                          {item.Name}
                        </h3>
                        {item.Type === "Series" && item.ChildCount && (
                          <p className="text-xs text-white/90 font-medium mt-1 text-center">
                            {item.ChildCount}{" "}
                            {item.ChildCount === 1 ? "Season" : "Seasons"}
                          </p>
                        )}
                        {item.ProductionYear && (
                          <p className="text-lg text-white/80 mt-1 text-center">
                            {item.ProductionYear}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        loading={itemsLoading}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
