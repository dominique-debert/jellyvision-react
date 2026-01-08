import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getItem } from "@/lib/jellyfin/client";
import { LoadingState, NotFoundState } from "./ItemDetail/shared";
import MovieDetail from "./ItemDetail/MovieDetail";
import ShowDetail from "./ItemDetail/ShowDetail";
import MusicDetail from "./ItemDetail/MusicDetail";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function ItemDetail() {
  const { itemId } = useParams<{ itemId: string }>();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [item, setItem] = useState<BaseItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!serverUrl || !userId || !accessToken || !itemId) {
        setLoading(false);
        setError(true);
        return;
      }

      setLoading(true);
      const result = await getItem(serverUrl, userId, itemId, accessToken);

      if (result.success && result.data) {
        setItem(result.data);
      } else {
        setError(true);
      }

      setLoading(false);
    };

    fetchItem();
  }, [serverUrl, userId, accessToken, itemId]);

  if (loading) return <LoadingState />;
  if (error || !item) return <NotFoundState />;

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
