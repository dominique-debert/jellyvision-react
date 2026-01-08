import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import Login from "./pages/Login";
import Home from "./pages/Home";
import LibraryDetail from "./pages/LibraryDetail";
import ItemDetail from "@/pages/ItemDetail";
import Player from "@/pages/Player";
import AudioPlayer from "@/pages/AudioPlayer";

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
          <Route path="/library/:libraryId" element={<LibraryDetail />} />
          <Route path="/item/:itemId" element={<ItemDetail />} />
          <Route path="/play/:itemId" element={<Player />} />
          <Route path="/audio/:itemId" element={<AudioPlayer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
