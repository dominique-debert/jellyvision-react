import { ChevronDown, ArrowDownUp } from "lucide-react";

interface MediaSortDropdownProps {
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
}

export function MediaSortDropdown({
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  showDropdown,
  setShowDropdown,
}: MediaSortDropdownProps) {
  return (
    <div className="relative">
      <button
        className="btn btn-md btn-ghost gap-2"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <span>
          <ArrowDownUp className="size-5" />
        </span>
        <ChevronDown className="size-5" />
      </button>
      {showDropdown && (
        <div className="absolute left-0 mt-2 w-64 bg-base-200 rounded-xl shadow-lg z-50 p-4 flex flex-col gap-4">
          <div>
            <div className="font-semibold mb-2">Sort By</div>
            <div className="flex flex-col gap-1">
              {[
                { label: "Name", value: "Name" },
                { label: "Community Rating", value: "CommunityRating" },
                { label: "Date Added", value: "DateAdded" },
                { label: "Release Date", value: "ReleaseDate" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={() => setSortBy(option.value)}
                    className="radio radio-sm"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">Sort Order</div>
            <div className="flex flex-col gap-1">
              {["Ascending", "Descending"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="sortOrder"
                    value={option}
                    checked={sortOrder === option}
                    onChange={() => setSortOrder(option)}
                    className="radio radio-sm"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
