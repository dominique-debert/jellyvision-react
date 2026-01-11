import { Layout } from "@/components/Layout";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="hero min-h-[60vh] bg-base-200">
        <div className="hero-content flex-col text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Jellyvision</h1>
          <p className="mb-8 text-lg text-base-content/70">
            Your personal media dashboard powered by Jellyfin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/library")}
            >
              Go to Library
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/nextup")}
            >
              Next Up
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate("/settings")}
            >
              Settings
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
