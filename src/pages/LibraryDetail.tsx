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
import {
  ArrowLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MediaItem {
  Id?: string;
  Name?: string | null;
  Type?: string;
  ImageTags?: { [key: string]: string } | null;
  ProductionYear?: number | null;
}

export default function LibraryDetail() {
  const { libraryId } = useParams<{ libraryId: string }>();
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [libraryType, setLibraryType] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 60;

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

      // Use different fetch strategy based on library type
      if (libraryType === "music") {
        // For music libraries, fetch albums recursively
        const albumsResult = await getAllAlbumsInLibrary(
          serverUrl,
          userId,
          libraryId,
          accessToken,
          startIndex,
          ITEMS_PER_PAGE
        );
        if (albumsResult.success) {
          setItems(albumsResult.data as MediaItem[]);
          setTotalCount(albumsResult.totalCount);
        }
      } else {
        // For movies, shows, and other libraries, fetch all items
        const itemsResult = await getLibraryItems(
          serverUrl,
          userId,
          libraryId,
          accessToken,
          startIndex,
          ITEMS_PER_PAGE
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
  }, [serverUrl, userId, accessToken, libraryId, currentPage, libraryType]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (loading) {
    return (
      <Layout>
        <div>
          <header className="border-b border-gray-800">
            <div className="container mx-auto px-4 py-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-2/3 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <header className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? "item" : "items"}
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No items found in this library
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((item) => (
                <Card
                  key={item.Id}
                  className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => navigate(`/item/${item.Id}`)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-2/3 bg-muted rounded overflow-hidden">
                      {item.Id && item.ImageTags?.["Primary"] && serverUrl ? (
                        <img
                          src={getImageUrl(serverUrl, item.Id, "Primary")}
                          alt={item.Name || "Media item"}
                          className="w-full h-full object-cover"
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
                    </div>
                    <div className="p-2">
                      <h3
                        className="text-sm font-medium truncate"
                        title={item.Name ?? undefined}
                      >
                        {item.Name}
                      </h3>
                      {item.ProductionYear && (
                        <p className="text-xs text-muted-foreground">
                          {item.ProductionYear}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
                variant="outline"
                size="icon"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                variant="outline"
                size="icon"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers().map((page, idx) =>
                page === -1 ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || loading}
                variant="outline"
                size="icon"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading}
                variant="outline"
                size="icon"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
