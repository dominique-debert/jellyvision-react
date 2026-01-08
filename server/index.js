import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(
  cors({
    origin: "*",
    methods: ["GET", "OPTIONS"],
    credentials: false,
  })
);

/**
 * Proxy endpoint for Jellyfin subtitles
 * This allows the React app to fetch external SRT files from Jellyfin server
 *
 * Usage: /api/subtitles?url=<jellyfin_subtitle_url>&format=<format>
 */
app.get("/api/subtitles", async (req, res) => {
  try {
    const { url, format } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    const decodedUrl = decodeURIComponent(url);
    console.log(`Proxying subtitle request: ${decodedUrl}`);

    // Fetch the subtitle file from Jellyfin
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      console.error(
        `Jellyfin returned ${response.status}: ${response.statusText}`
      );
      return res.status(response.status).json({
        error: `Failed to fetch from Jellyfin: ${response.statusText}`,
      });
    }

    let content = await response.text();
    const contentType = response.headers.get("content-type") || "text/plain";

    // If SRT format requested, add VTT header (SRT is mostly VTT compatible)
    if (format === "vtt" && !content.startsWith("WEBVTT")) {
      content = "WEBVTT\n\n" + content;
    }

    // Return with appropriate content type
    res.set("Content-Type", "text/vtt; charset=utf-8");
    res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.send(content);
  } catch (error) {
    console.error("Subtitle proxy error:", error.message);
    res.status(500).json({ error: `Proxy error: ${error.message}` });
  }
});

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Subtitle proxy server listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(
    `Subtitle endpoint: http://localhost:${PORT}/api/subtitles?url=<encoded_url>`
  );
});
