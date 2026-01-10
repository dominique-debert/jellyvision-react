import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { getImageUrl } from "@/lib/jellyfin/client";

export const CastAndCrewSection = ({
  item,
  serverUrl,
}: {
  item: BaseItemDto;
  serverUrl: string | null;
}) => {
  const directors = item.People?.filter((p) => p.Type === "Director") || [];
  const writers = item.People?.filter((p) => p.Type === "Writer") || [];
  const actors = item.People?.filter((p) => p.Type === "Actor") || [];

  return (
    <div>
      <div className="flex items-start gap-8">
        {/* Left: Crew List (Vertical) */}
        <div className="w-56 shrink-0 space-y-6">
          {/* Directors */}
          <div className="flex flex-col items-start space-y-1">
            <h3 className="text-white/70 font-medium mb-3">Directors</h3>
            {directors.length > 0 ? (
              <div className="space-y-1">
                {directors.map((director) => (
                  <div key={director.Id} className="text-white text-sm">
                    {director.Name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">No directors found</div>
            )}
          </div>

          {/* Screenwriters */}
          <div className="flex flex-col items-start space-y-1">
            <h3 className="text-white/70 font-medium mb-3">Screenwriters</h3>
            {writers.length > 0 ? (
              <div className="space-y-1">
                {writers.map((writer) => (
                  <div key={writer.Id} className="text-white text-sm">
                    {writer.Name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">
                No screenwriters found
              </div>
            )}
          </div>
        </div>

        {/* Right: Actors (Grid) */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white/70 font-medium mb-4 text-left">Actors</h3>
          {actors.filter((a) => a.PrimaryImageTag).length > 0 ? (
            <div className="grid grid-cols-2 items-start md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {actors
                .filter(
                  (actor) => actor.PrimaryImageTag && serverUrl && actor.Id
                )
                .slice(0, 10)
                .map((actor) => (
                  <div key={actor.Id} className="flex flex-col items-start">
                    <img
                      src={getImageUrl(
                        serverUrl!,
                        actor.Id!,
                        "Primary",
                        160,
                        160,
                        85
                      )}
                      alt={actor.Name || "Actor"}
                      className="w-20 h-20 rounded-full object-cover mb-2"
                      loading="lazy"
                    />
                    <p className="text-white text-xs font-medium text-center line-clamp-2">
                      {actor.Name}
                    </p>
                    {actor.Role && (
                      <p className="text-zinc-400 text-xs text-center line-clamp-1">
                        as {actor.Role}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">
              No actors with images found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
