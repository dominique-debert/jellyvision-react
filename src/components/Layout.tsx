import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Search, User, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { getUserById, getUserImageUrl } from "@/lib/jellyfin/client";

interface LayoutProps {
  backdropUrl?: string;
}

export function Layout({ backdropUrl }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const { username, logout, serverUrl, userId, accessToken } = useAuthStore();

  // Fetch user image using TanStack Query
  const { data: userImageUrl } = useQuery({
    queryKey: ["userImageUrl", serverUrl, userId, accessToken],
    queryFn: async () => {
      if (!serverUrl || !userId || !accessToken) return null;
      const result = await getUserById(serverUrl, userId, accessToken);
      if (result.success && result.data) {
        return (
          getUserImageUrl(
            serverUrl,
            { Id: userId, PrimaryImageTag: result.data.PrimaryImageTag },
            accessToken,
          ) ?? null
        );
      }
      return null;
    },
    enabled: !!serverUrl && !!userId && !!accessToken,
    staleTime: 1000 * 60 * 10, // cache for 10 minutes
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput)}`);
      setSearchInput("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen text-base-content relative">
      {backdropUrl && (
        <div
          className="fixed left-0 inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
            backgroundBlendMode: "multiply",
            backgroundPosition: "top left",
          }}
        />
      )}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <header className="fixed top-0 left-0 right-0 h-20 bg-transparent backdrop-blur-sm z-40 flex items-center px-10 gap-4">
        <div className="flex items-center gap-4 ml-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-white/30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="input input-md input-bordered w-80 pr-12 focus:outline-none focus:ring-1 focus:ring-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </form>

          {/* User Menu */}
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-circle avatar"
              title={username || "User"}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {userImageUrl ? (
                  <img
                    src={userImageUrl}
                    alt={username || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget
                        .nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full bg-primary/20 flex items-center justify-center"
                  style={{ display: userImageUrl ? "none" : "flex" }}
                >
                  <User className="w-5 h-5" />
                </div>
              </div>
            </button>
            <ul
              tabIndex={0}
              className="menu dropdown-content bg-base-300 rounded-box z-50 mt-3 w-52 p-2 shadow-xl border border-base-content/10"
            >
              <li className="menu-title px-4 py-2">
                <span className="text-sm font-semibold">
                  {username || "User"}
                </span>
              </li>
              <li>
                <button className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-error"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main
        className={`pt-20 transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
