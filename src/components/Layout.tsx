import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Search, User, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { getUserById, getUserImageUrl } from "@/lib/jellyfin/client";

interface LayoutProps {
  children: ReactNode;
  backdropUrl?: string;
}

export function Layout({ children, backdropUrl }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { username, logout, serverUrl, userId, accessToken } = useAuthStore();

  useEffect(() => {
    const fetchUserImage = async () => {
      if (!serverUrl || !userId || !accessToken) return;

      const result = await getUserById(serverUrl, userId, accessToken);
      if (result.success && result.data) {
        const imageUrl = getUserImageUrl(
          serverUrl,
          { Id: userId, PrimaryImageTag: result.data.PrimaryImageTag },
          accessToken
        );
        setUserImageUrl(imageUrl);
      }
    };

    fetchUserImage();
  }, [serverUrl, userId, accessToken]);

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

  const defaultGradient =
    "linear-gradient(to bottom right, transparent, transparent))";

  // Calculate sidebar width in pixels: collapsed = 80px (left-20 = 5rem), expanded = 256px (left-64 = 16rem)
  const sidebarWidth = isCollapsed ? 80 : 256;

  return (
    <div
      className="min-h-screen text-base-content w-full"
      style={{
        background: backdropUrl
          ? `url(${backdropUrl}) calc(50% + ${sidebarWidth}px)/cover no-repeat fixed, ${defaultGradient}`
          : "transparent",
        backgroundBlendMode: backdropUrl ? "multiply" : "normal",
        backgroundPosition: backdropUrl
          ? `calc(50% + ${sidebarWidth}px) center`
          : undefined,
      }}
    >
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Header */}
      <header
        className={`fixed top-0 right-0 h-16 bg-base-300/80 backdrop-blur-sm border-b border-base-content/10 z-40 flex items-center px-6 transition-all duration-300 ${
          isCollapsed ? "left-20" : "left-64"
        }`}
      >
        <div className="flex items-center gap-4 ml-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-white/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="input input-sm input-bordered w-80 pr-12 focus:outline-none focus:ring-1 focus:ring-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
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

      <div
        className={`fixed right-0 top-16 bottom-10 overflow-auto transition-all duration-300 ${
          isCollapsed ? "left-20" : "left-64"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
