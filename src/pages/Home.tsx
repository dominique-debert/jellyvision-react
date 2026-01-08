import { UserProfile } from "@/components/UserProfile";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">Jellyfin</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <UserProfile />

        <div>
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
        </div>
      </main>
    </div>
  );
}
