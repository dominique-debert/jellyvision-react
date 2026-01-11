import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import {
  getLibraryItems,
  getImageUrl,
  getAllAlbumsInLibrary,
  getItem,
} from "@/lib/jellyfin/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, CircleCheck, ChevronDown } from "lucide-react";
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
  const [sortBy, setSortBy] = useState(
    () => localStorage.getItem("librarySortBy") || "Name"
  );
  const [sortOrder, setSortOrder] = useState(
    () => localStorage.getItem("librarySortOrder") || "Ascending"
  );
  const [items, setItems] = useState<MediaItem[]>([]);
  const { libraryId } = useParams<{ libraryId: string }>();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [libraryType, setLibraryType] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 60;

  useEffect(() => {
    localStorage.setItem("librarySortBy", sortBy);
    localStorage.setItem("librarySortOrder", sortOrder);
  }, [sortBy, sortOrder]);

  // Fetch library info to determine type
  useEffect(() => {
    const fetchLibraryInfo = async () => {
      if (!serverUrl || !userId || !accessToken || !libraryId) return;
      const result = await getItem(serverUrl, userId, libraryId, accessToken);
      if (result.success && result.data) {
        setLibraryType(result.data.CollectionType || null);
      }
    };
    fetchLibraryInfo();
  }, [serverUrl, userId, accessToken, libraryId]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!serverUrl || !userId || !accessToken || !libraryId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

      // Map sortBy to Jellyfin API sortBy fields
      // Map sortBy to Jellyfin API sortBy fields

      // Map sortBy to Jellyfin API fields
      let apiSortBy = sortBy;
      if (sortBy === "DateAdded") apiSortBy = "DateCreated";

      // Use different fetch strategy based on library type
      if (libraryType === "music") {
        // For music libraries, fetch albums recursively
        const albumsResult = await getAllAlbumsInLibrary(
          serverUrl,
          userId,
          libraryId,
          accessToken,
          startIndex,
          ITEMS_PER_PAGE,
          apiSortBy,
          sortOrder
        );
        if (albumsResult.success) {
          setItems(albumsResult.data as MediaItem[]);
          setTotalCount(albumsResult.totalCount);
        }
      } else {
        // For TV libraries, fetch only Series items (avoid Season items)
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
          sortOrder
        );
        if (itemsResult.success) {
          setItems(itemsResult.data as MediaItem[]);
          setTotalCount(itemsResult.totalCount);
        }
      }

      setLoading(false);
    };

    if (libraryType !== null) {
      fetchItems();
    }
  }, [
    serverUrl,
    userId,
    accessToken,
    libraryId,
    currentPage,
    libraryType,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div>
        <header className="border-b border-base-300 pb-0 pt-4">
          <div className="mx-auto pl-15 pr-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="relative">
                <button
                  className="btn btn-ghost flex items-center gap-2"
                  onClick={() => setShowDropdown((v) => !v)}
                >
                  <span>Sort</span>
                  <ChevronDown className="size-4" />
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
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </p>
          </div>
        </header>

        <main className="ml-10 mr-10 px-4 py-8 pt-4 pb-30">
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
                            85
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
                      {/* Watched indicator - only for non-music items */}
                      {item.UserData?.Played && libraryType !== "music" && (
                        <div className="absolute top-2 right-2 rounded-full p-1 shadow-lg">
                          <CircleCheck className="size-6  text-green-700/90" />
                        </div>
                      )}
                      {/* Hover overlay with play button centered and title at bottom */}
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

          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            loading={loading}
            onPageChange={setCurrentPage}
          />
        </main>
      </div>
    </Layout>
  );
}
