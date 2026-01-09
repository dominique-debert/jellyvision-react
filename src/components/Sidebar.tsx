import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getUserViews } from "@/lib/jellyfin/client";
import { Home, Film, Tv, Music, Menu, Search } from "lucide-react";
import visionLogo from "@/assets/vision.png";
import visionIcon from "@/assets/vision-icon.png";

interface Library {
  Id?: string;
  Name?: string | null;
  CollectionType?: string | null;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { serverUrl, accessToken, userId } = useAuthStore();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput)}`);
      setSearchInput("");
    }
  };

  useEffect(() => {
    const fetchLibraries = async () => {
      if (!serverUrl || !userId || !accessToken) return;

      const result = await getUserViews(serverUrl, userId, accessToken);
      if (result.success) {
        setLibraries(result.data as Library[]);
      }
    };

    fetchLibraries();
  }, [serverUrl, userId, accessToken]);

  const getLibraryByType = (type: string) => {
    return libraries.find((lib) => lib.CollectionType === type);
  };

  const navItems = [
    {
      label: "Home",
      icon: Home,
      path: "/",
      isActive: location.pathname === "/",
    },
    {
      label: "Movies",
      icon: Film,
      path: `/library/${getLibraryByType("movies")?.Id}`,
      isActive: location.pathname.includes(
        `/library/${getLibraryByType("movies")?.Id}`
      ),
      disabled: !getLibraryByType("movies"),
    },
    {
      label: "TV Shows",
      icon: Tv,
      path: `/library/${getLibraryByType("tvshows")?.Id}`,
      isActive: location.pathname.includes(
        `/library/${getLibraryByType("tvshows")?.Id}`
      ),
      disabled: !getLibraryByType("tvshows"),
    },
    {
      label: "Music",
      icon: Music,
      path: `/library/${getLibraryByType("music")?.Id}`,
      isActive: location.pathname.includes(
        `/library/${getLibraryByType("music")?.Id}`
      ),
      disabled: !getLibraryByType("music"),
    },
    // {
    //   label: "Collections",
    //   icon: Folder,
    //   path: "#",
    //   isActive: false,
    //   disabled: true,
    // },
    // {
    //   label: "Watchlist",
    //   icon: Bookmark,
    //   path: "#",
    //   isActive: false,
    //   disabled: true,
    // },
  ];

  return (
    <aside
      className={`fixed bg-base-300 left-0 top-0 h-full flex flex-col z-50 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex items-center ${
          isCollapsed ? "justify-center pt-6 pb-5" : "justify-between p-6 pb-5"
        } gap-3`}
      >
        {isCollapsed ? (
          <img src={visionIcon} alt="Vision" className="h-6 w-auto" />
        ) : (
          <img src={visionLogo} alt="Vision" className="h-6 w-auto" />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-base-300 rounded-lg transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="px-4 py-4 flex items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={isCollapsed ? "" : "Search..."}
          title="Search"
          className="input input-sm input-bordered flex-1 focus:outline-none focus:ring-1 focus:ring-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        />
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      <nav className="flex flex-col p-5! gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                item.isActive
                  ? "bg-primary text-white font-medium"
                  : item.disabled
                  ? "text-base-content/40 cursor-not-allowed"
                  : "text-base-content hover:bg-primary/20 hover:text-white/80"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="size-6 shrink-0" />
              {!isCollapsed && (
                <span className="text-xl font-normal">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
