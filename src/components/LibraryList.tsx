import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getUserViews, getImageUrl } from "@/lib/jellyfin/client";
import { Card, CardContent } from "@/components/ui/card";

interface Library {
  Id?: string;
  Name?: string | null;
  CollectionType?: string;
  ImageTags?: { [key: string]: string } | null;
}

export function LibraryList() {
  const navigate = useNavigate();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibraries = async () => {
      if (!serverUrl || !userId || !accessToken) {
        setLoading(false);
        return;
      }

      const result = await getUserViews(serverUrl, userId, accessToken);

      if (result.success) {
        setLibraries(result.data);
      }

      setLoading(false);
    };

    fetchLibraries();
  }, [serverUrl, userId, accessToken]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
              <div className="mt-4 h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (libraries.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No libraries found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {libraries.map((library) => (
        <Card
          key={library.Id}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => library.Id && navigate(`/library/${library.Id}`)}
        >
          <CardContent className="p-6">
            {library.Id && library.ImageTags?.["Primary"] && serverUrl ? (
              <div className="aspect-video bg-muted rounded mb-4 overflow-hidden">
                <img
                  src={getImageUrl(serverUrl, library.Id, "Primary")}
                  alt={library.Name || "Library"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded mb-4 flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
            )}
            <h3 className="text-lg font-semibold">{library.Name}</h3>
            {library.CollectionType && (
              <p className="text-sm text-muted-foreground capitalize">
                {library.CollectionType}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
