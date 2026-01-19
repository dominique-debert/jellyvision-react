import { useParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { getItem } from "@/lib/jellyfin/client";
import { LoadingState, NotFoundState } from "@/pages/ItemDetail/shared";
import MovieDetail from "@/pages/ItemDetail/MovieDetail";
import ShowDetail from "@/pages/ItemDetail/ShowDetail";
import MusicDetail from "@/pages/ItemDetail/MusicDetail";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function ItemDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const { serverUrl, accessToken, userId } = useAuthStore();

  const {
    data: item,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["itemDetail", serverUrl, userId, accessToken, itemId],
    queryFn: async () => {
      if (!serverUrl || !userId || !accessToken || !itemId) {
        throw new Error("Missing credentials or itemId");
      }
      const result = await getItem(serverUrl, userId, itemId, accessToken);
      if (result.success && result.data) return result.data;
      throw new Error("Not found");
    },
    enabled: !!serverUrl && !!userId && !!accessToken && !!itemId,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !item) return <NotFoundState />;

  // Route to appropriate detail component based on item type
  if (item.Type === "MusicAlbum") {
    return <MusicDetail />;
  }

  if (
    item.Type === "Series" ||
    (item.Type === "Season" && (item as any).SeriesId)
  ) {
    return <ShowDetail />;
  }

  // Default to MovieDetail for Movie, Episode, and other types
  return <MovieDetail />;
}
