import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import Login from "./pages/Login";
import Home from "./pages/Home";
import LibraryDetail from "./pages/LibraryDetail";
import ItemDetail from "@/pages/ItemDetail";
import Player from "@/pages/Player";
import SearchResults from "@/pages/SearchResults";
import NextUpPage from "./pages/NextUpPage";
import RecentlyAddedMoviesPage from "./pages/RecentlyAddedMoviesPage";
import RecentlyAddedMusicPage from "./pages/RecentlyAddedMusicPage";
import RecentlyAddedShowsPage from "./pages/RecentlyAddedShowsPage";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      {isAuthenticated ? (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/library/:libraryId" element={<LibraryDetail />} />
          <Route path="/item/:itemId" element={<ItemDetail />} />
          <Route path="/play/:itemId" element={<Player />} />
          <Route path="/nextup" element={<NextUpPage />} />
          <Route
            path="/recentlyaddedmovies"
            element={<RecentlyAddedMoviesPage />}
          />
          <Route
            path="/recentlyaddedmusic"
            element={<RecentlyAddedMusicPage />}
          />
          <Route
            path="/recentlyaddedshows"
            element={<RecentlyAddedShowsPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
