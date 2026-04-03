import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export const SynopsisSection = ({ item }: { item: BaseItemDto }) => {
  if (!item.Overview) return null;
  return (
    <div className="flex flex-col items-start">
      <h2 className="text-white/70 font-medium mb-2">Synopsis</h2>
      <p className="text-zinc-300 font-light text-justify p-0 m-0 leading-relaxed">
        {item.Overview}
      </p>
    </div>
  );
};
