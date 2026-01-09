import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Layout } from "@/components/Layout";
import { ItemCard } from "@/components/ItemCard";
import { searchItems } from "@/lib/jellyfin/search";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { serverUrl, userId, accessToken } = useAuthStore();
  const searchTerm = searchParams.get("q") || "";

  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<BaseItemDto[]>([]);
  const [shows, setShows] = useState<BaseItemDto[]>([]);
  const [music, setMusic] = useState<BaseItemDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setLoading(false);
        return;
      }

      if (!serverUrl || !userId || !accessToken) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const result = await searchItems(
        serverUrl,
        userId,
        accessToken,
        searchTerm
      );

      if (result.success) {
        setMovies(result.data.movies);
        setShows(result.data.shows);
        setMusic(result.data.music);
      } else {
        setError(result.error || "Failed to search");
      }

      setLoading(false);
    };

    performSearch();
  }, [searchTerm, serverUrl, userId, accessToken]);

  if (!searchTerm.trim()) {
    return (
      <Layout>
        <div className="p-8">
          <p className="text-xl text-base-content/60">
            Enter a search term to get started
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-2">Search Results</h1>
        <p className="text-lg text-base-content/60 mb-8">
          Results for "<span className="font-semibold">{searchTerm}</span>"
        </p>

        {loading && (
          <div className="text-center py-12">
            <p className="text-xl text-base-content/60">Searching...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-8">
            <p>{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          movies.length === 0 &&
          shows.length === 0 &&
          music.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-base-content/60">No results found</p>
            </div>
          )}

        {!loading && movies.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {movies.map((item) => (
                <ItemCard
                  key={item.Id}
                  item={item}
                  onClick={() => navigate(`/item/${item.Id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && shows.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">TV Shows</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {shows.map((item) => (
                <ItemCard
                  key={item.Id}
                  item={item}
                  onClick={() => navigate(`/item/${item.Id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && music.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Music</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {music.map((item) => (
                <ItemCard
                  key={item.Id}
                  item={item}
                  onClick={() => navigate(`/item/${item.Id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
