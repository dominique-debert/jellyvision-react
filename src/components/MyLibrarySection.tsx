import { Library } from "lucide-react";
import { getImageUrl, useUserViewsQuery } from "@/lib/jellyfin/client";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export interface MyLibrarySectionProps {
  items: BaseItemDto[];
  serverUrl: string;
  loading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right",
  ) => void;
}

interface Library {
  Id?: string;
  Name?: string | null;
  CollectionType?: string | null;
  ImageTags?: { [key: string]: string } | null;
}

export function MyLibrarySection({ scrollRef }: MyLibrarySectionProps) {
  const navigate = useNavigate();
  const { serverUrl, userId, accessToken } = useAuthStore();
  const { data: libraries = [], isLoading } = useUserViewsQuery(
    serverUrl!,
    userId!,
    accessToken!,
  );

  if (isLoading || libraries.length === 0) return null;
  return (
    <section>
      <div className="flex items-center ml-16">
        <h2 className="text-2xl font-light flex items-center gap-3">
          <Library className="size-5 inline-block mr-2" /> My Library
        </h2>
      </div>
      <div
        ref={scrollRef}
        className="flex ml-16 gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4 mt-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {libraries.map((lib) => {
          let posterUrl: string | null = null;
          if (lib.Id && serverUrl && lib.ImageTags) {
            if (lib.ImageTags.Primary) {
              posterUrl = getImageUrl(serverUrl, lib.Id, "Primary", 400, 600);
            } else if (lib.ImageTags.Thumb) {
              posterUrl = getImageUrl(serverUrl, lib.Id, "Thumb", 400, 600);
            } else if (lib.ImageTags.Backdrop) {
              posterUrl = getImageUrl(serverUrl, lib.Id, "Backdrop", 400, 600);
            }
          }
          return (
            <div key={lib.Id} className="flex-none w-84">
              <div
                className="bg-base-200 shadow-md cursor-pointer h-full flex flex-col items-center justify-center hover:bg-primary/10 transition overflow-hidden p-0 rounded-xl"
                onClick={() => lib.Id && navigate(`/library/${lib.Id}`)}
              >
                <div className="w-full aspect-3/2 flex items-center justify-center overflow-hidden">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={lib.Name || "Library poster"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-base-300 text-base-content/40">
                      No Image
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
