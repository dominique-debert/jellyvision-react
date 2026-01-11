import { Layout } from "@/components/Layout";
import MediaGrid from "@/components/MediaGrid";
import MediaSortDropdown from "@/components/MediaSortDropdown";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchRecentlyAddedShows } from "@/lib/jellyfin/extraMediaFetchers";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RecentlyAddedShowsPage() {
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("Name");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const navigate = useNavigate();

  useEffect(() => {
    if (!serverUrl || !userId || !accessToken) return;
    setLoading(true);
    fetchRecentlyAddedShows(serverUrl, userId, accessToken).then((result) => {
      setItems(result.success ? result.data : []);
      setLoading(false);
    });
  }, [serverUrl, userId, accessToken]);

  const sortedItems = useMemo(() => {
    if (!items) return [];
    const copy = [...items];
    const getVal = (it: any) => {
      switch (sortBy) {
        case "CommunityRating":
          return it.CommunityRating ?? 0;
        case "DateAdded":
          return it.DateCreated ? new Date(it.DateCreated).getTime() : 0;
        case "ReleaseDate":
          return it.PremiereDate
            ? new Date(it.PremiereDate).getTime()
            : it.ProductionYear ?? 0;
        case "Name":
        default:
          return it.Name ?? "";
      }
    };
    copy.sort((a: any, b: any) => {
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
    <Layout>
      <div>
        <header className="border-b border-base-300 pb-0 pt-4">
          <div className="mx-auto pl-15 pr-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                className="btn btn-md btn-ghost gap-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="size-6" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <MediaSortDropdown
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
              />
            </div>
          </div>
        </header>

        <main className="ml-10 mr-10 px-4 py-8 pt-4 pb-30">
          <h1 className="text-2xl font-bold mb-6">Recently Added Shows</h1>
          <MediaGrid items={sortedItems} loading={loading} />
        </main>
      </div>
    </Layout>
  );
}
