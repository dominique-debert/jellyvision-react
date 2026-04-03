import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useNextUpQuery } from "@/lib/jellyfin/extraMediaFetchers";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { ItemCard } from "@/components/ItemCard";
import { MediaSortDropdown } from "@/components/MediaSortDropdown";

export default function NextUpPage() {
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("Name");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const navigate = useNavigate();

  // Use TanStack Query to fetch Next Up items
  const { data: items = [], isLoading: loading } = useNextUpQuery(
    serverUrl!,
    userId!,
    accessToken!,
  );

  const sortedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
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
      <header className="border-b border-base-300 bg-transparent pb-0 pt-4 backdrop-blur-lg">
        <h1 className="text-4xl font-light w-full text-left mb-10 mt-6 ml-15">
          Next Up
        </h1>
        <div className="mx-auto pl-15 pr-20 flex items-center justify-start">
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

      <main className="ml-10 mr-10 px-4 py-8 pt-5 pb-45 overflow-y-auto h-screen [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 mt-6 pb-30">
            {loading ? (
              <div className="loading loading-bars loading-lg mx-auto my-10 col-span-full" />
            ) : sortedItems.length === 0 ? (
              <div className="text-zinc-400 text-lg mx-auto my-10 col-span-full">
                No items found.
              </div>
            ) : (
              sortedItems.map((item) => (
                <div key={item.Id} className="w-full">
                  <ItemCard
                    item={item}
                    serverUrl={serverUrl ?? ""}
                    onPlayClick={() => navigate(`/play/${item.Id}?from=nextup`)}
                  />
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
