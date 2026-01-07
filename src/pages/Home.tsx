import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Home() {
  const { username, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Jellyfin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Welcome, {username}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Your Media Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for library sections */}
          <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
            <h3 className="text-xl font-semibold mb-2">Movies</h3>
            <p className="text-gray-400">Browse your movie collection</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
            <h3 className="text-xl font-semibold mb-2">TV Shows</h3>
            <p className="text-gray-400">Watch your favorite series</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer">
            <h3 className="text-xl font-semibold mb-2">Music</h3>
            <p className="text-gray-400">Listen to your music library</p>
          </div>
        </div>
      </main>
    </div>
  );
}
