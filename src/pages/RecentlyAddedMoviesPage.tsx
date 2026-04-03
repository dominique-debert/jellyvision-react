import { MediaGrid } from "@/components/MediaGrid";
import { MediaSortDropdown } from "@/components/MediaSortDropdown";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRecentlyAddedMoviesQuery } from "@/lib/jellyfin/extraMediaFetchers";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function RecentlyAddedMoviesPage() {
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("DateAdded");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const navigate = useNavigate();

  // Use TanStack Query to fetch recently added movies
  const { data: items = [], isLoading: loading } = useRecentlyAddedMoviesQuery(
    serverUrl!,
    userId!,
    accessToken!,
  );

  const sortedItems = useMemo(() => {
    if (!items) return [];
    const copy = [...items];
    const getVal = (it: BaseItemDto) => {
      switch (sortBy) {
        case "CommunityRating":
          return it.CommunityRating ?? 0;
        case "DateAdded":
          return it.DateCreated ? new Date(it.DateCreated).getTime() : 0;
        case "ReleaseDate":
          return it.PremiereDate
            ? new Date(it.PremiereDate).getTime()
            : (it.ProductionYear ?? 0);
        case "Name":
        default:
          return it.Name ?? "";
      }
    };
    copy.sort((a: BaseItemDto, b: BaseItemDto) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === "string" && typeof vb === "string") {
        return sortOrder === "Ascending"
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      }
      return sortOrder === "Ascending"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return copy;
  }, [items, sortBy, sortOrder]);

  return (
    <div>
      <header className="border-b border-base-300 pb-0 pt-4">
        <h1 className="text-4xl font-light w-full text-left mb-10 mt-6 ml-14">
          Recently Added Movies
        </h1>
        <div className="mx-auto pl-15 mb-4 pr-4 flex items-center justify-start">
          <div className="flex items-center gap-4">
            <button
              className="btn btn-md btn-primary gap-2"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ArrowLeft className="size-6" />
              Back
            </button>
          </div>
          <div className="flex items-center gap-4">
            {MediaSortDropdown ? (
              <MediaSortDropdown
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
              />
            ) : null}
          </div>
        </div>
      </header>

      <main className="ml-10 mr-10 px-4 py-8 pt-4 pb-55 overflow-y-auto h-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MediaGrid items={sortedItems} loading={loading} />
      </main>
    </div>
  );
}
