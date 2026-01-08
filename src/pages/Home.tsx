import { UserProfile } from "@/components/UserProfile";
import { LibraryList } from "@/components/LibraryList";

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
          <LibraryList />
        </div>
      </main>
    </div>
  );
}
