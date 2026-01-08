import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
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
 * Proxy endpoint for Jellyfin subtitles with fallback endpoints
 *
 * Method 1 (Direct URL): /api/subtitles?url=<jellyfin_url>&format=vtt
 * Method 2 (Params): /api/subtitles?serverUrl=<url>&itemId=<id>&subtitleIndex=<idx>&format=vtt&apiKey=<key>
 */
app.get("/api/subtitles", async (req, res) => {
  try {
    const { url, serverUrl, itemId, subtitleIndex, format, apiKey, filePath } =
      req.query;

    console.log("[Request] Received params:", {
      url: !!url,
      serverUrl: !!serverUrl,
      itemId: !!itemId,
      subtitleIndex: !!subtitleIndex,
      format: !!format,
      apiKey: !!apiKey,
      filePath: !!filePath,
    });

    // Try direct URL first if provided
    if (url) {
      const decodedUrl = decodeURIComponent(url);
      console.log(`[Direct] Attempting: ${decodedUrl}`);
      const result = await fetchSubtitleFromUrl(decodedUrl);

      if (result.success) {
        return sendSubtitleResponse(res, result.content, format);
      }

      console.log(
        `[Direct] Failed with status ${result.status}. Trying alternatives...`
      );

      // If direct URL fails and we have params, try alternatives
      if (serverUrl && itemId && subtitleIndex) {
        console.log(`[Fallback] Using parameter-based endpoints`);
        const httpResult = await tryAlternativeEndpoints(
          res,
          serverUrl,
          itemId,
          subtitleIndex,
          format,
          apiKey,
          false
        );
        if (httpResult && httpResult.success) {
          return sendSubtitleResponse(res, httpResult.content, format);
        }
      }
    }

    // Try parameter-based HTTP endpoints first
    if (serverUrl && itemId && subtitleIndex) {
      console.log(`[Primary] Trying parameter-based HTTP endpoints`);
      const httpResult = await tryAlternativeEndpoints(
        res,
        serverUrl,
        itemId,
        subtitleIndex,
        format,
        apiKey,
        false
      );
      if (httpResult && httpResult.success) {
        return sendSubtitleResponse(res, httpResult.content, format);
      }

      // If HTTP failed, try reading from file path
      if (filePath) {
        const decodedPath = decodeURIComponent(filePath);
        console.log(`[Fallback] HTTP endpoints failed, trying file access`);
        const fileResult = await readSubtitleFromFile(decodedPath);
        if (fileResult.success) {
          return sendSubtitleResponse(res, fileResult.content, format);
        }
      }

      // Both HTTP and file access failed
      console.log(`[Fail] All methods failed`);
      res.status(404).json({
        error:
          "Could not load external subtitles. Jellyfin does not expose external SRT files via HTTP API. Consider using embedded subtitles or accessing subtitles through Jellyfin's web interface.",
        tried_http: true,
        tried_file: !!filePath,
      });
      return;
    }

    res.status(400).json({ error: "Missing required parameters" });
  } catch (error) {
    console.error("[ERROR]", error.message);
    res.status(500).json({ error: `Proxy error: ${error.message}` });
  }
});

/**
 * Attempt to fetch subtitle from a direct URL
 */
async function fetchSubtitleFromUrl(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const content = await response.text();
      return { success: true, content, status: 200 };
    }
    return { success: false, status: response.status };
  } catch (error) {
    return { success: false, status: 0, error: error.message };
  }
}

/**
 * Try multiple alternative Jellyfin subtitle endpoints
 * Returns {success, content} or null if all failed
 */
async function tryAlternativeEndpoints(
  res,
  serverUrl,
  itemId,
  subtitleIndex,
  format,
  apiKey,
  autoSend = true
) {
  const apiParam = apiKey ? `?api_key=${apiKey}` : "";

  const endpoints = [
    `${serverUrl}/Videos/${itemId}/Subtitles/${subtitleIndex}/vtt${apiParam}`,
    `${serverUrl}/Videos/${itemId}/Subtitles/${subtitleIndex}/0/vtt${apiParam}`,
    `${serverUrl}/Videos/${itemId}/Subtitles/${subtitleIndex}${apiParam}`,
    `${serverUrl}/Items/${itemId}/Subtitles/${subtitleIndex}${apiParam}`,
  ];

  for (const endpoint of endpoints) {
    const displayUrl = endpoint.split("?")[0];
    console.log(`[Try] ${displayUrl}`);

    try {
      const response = await fetch(endpoint);

      if (response.ok) {
        const content = await response.text();
        console.log(`[Success] Got content (${content.length} chars)`);
        if (autoSend) {
          return sendSubtitleResponse(res, content, format);
        }
        return { success: true, content };
      }

      console.log(`[Fail] Status ${response.status}`);
    } catch (error) {
      console.log(`[Error] ${error.message}`);
    }
  }

  // All HTTP endpoints failed
  if (autoSend) {
    res.status(404).json({
      error: "Could not fetch subtitles from Jellyfin",
      endpoints_tried: endpoints.length,
    });
    return null;
  }
  return null;
}

/**
 * Try to read subtitle from file path
 */
async function readSubtitleFromFile(filePath) {
  try {
    if (!filePath || filePath.trim() === "") {
      console.log("[File] No file path provided");
      return { success: false };
    }

    console.log(`[File] Attempting to read: ${filePath}`);
    const content = await fs.promises.readFile(filePath, "utf-8");
    console.log(`[File] Success: Got content (${content.length} chars)`);
    return { success: true, content };
  } catch (error) {
    console.log(`[File] Error: ${error.message}`);
    return { success: false };
  }
}

/**
 * Send subtitle response with format conversion
 */
function sendSubtitleResponse(res, content, format) {
  // Convert SRT to VTT if needed
  if (format === "vtt" && !content.startsWith("WEBVTT")) {
    content = "WEBVTT\n\n" + content;
  }

  res.set("Content-Type", "text/vtt; charset=utf-8");
  res.set("Cache-Control", "public, max-age=86400");
  res.send(content);
}

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
  console.error("[SERVER ERROR]", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Subtitle proxy server listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(
    `Subtitle endpoint: http://localhost:${PORT}/api/subtitles?url=<encoded_url>`
  );
  console.log(
    `Alternative: http://localhost:${PORT}/api/subtitles?serverUrl=<url>&itemId=<id>&subtitleIndex=<idx>&apiKey=<key>`
  );
});
