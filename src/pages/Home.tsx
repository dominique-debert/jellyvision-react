import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { ItemCard } from "@/components/ItemCard";
import { getResumeItems, getLatestMedia } from "@/lib/jellyfin/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function Home() {
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [resumeItems, setResumeItems] = useState<BaseItemDto[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<BaseItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const recentScrollRef = useRef<HTMLDivElement>(null);

  const scrollRecent = (direction: "left" | "right") => {
    if (recentScrollRef.current) {
      const scrollAmount = 800;
      const newScrollLeft =
        direction === "left"
          ? recentScrollRef.current.scrollLeft - scrollAmount
          : recentScrollRef.current.scrollLeft + scrollAmount;
      recentScrollRef.current.scrollTo({
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

      // Fetch recently added items across all libraries
      const recentResult = await getLatestMedia(
        serverUrl,
        userId,
        accessToken,
        undefined,
        16
      );
      if (recentResult.success) {
        setRecentlyAdded(recentResult.data);
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
                <ItemCard key={item.Id} item={item} serverUrl={serverUrl!} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Added Section */}
        {!loading && recentlyAdded.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center">
                <span className="mr-3">🕒</span> Recently added
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollRecent("left")}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollRecent("right")}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div
              ref={recentScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {recentlyAdded.map((item) => (
                <div key={item.Id} className="flex-none w-48">
                  <ItemCard item={item} serverUrl={serverUrl!} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}
