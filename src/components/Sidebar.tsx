import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { getUserViews } from "@/lib/jellyfin/client";
import { Home, Film, Tv, Music, Folder, Bookmark, Menu } from "lucide-react";

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
      <div className="flex items-center justify-between p-5!">
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-primary flex items-center gap-8">
            <svg
              className="w-8 h-8 mr-2"
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z" />
            </svg>
            Vision
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-base-300 rounded-lg transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex flex-col p-5! gap-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                item.isActive
                  ? "bg-secondary text-white/60"
                  : item.disabled
                  ? "text-base-content/40 cursor-not-allowed"
                  : "text-base-content hover:bg-base-300"
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
