# Jellyfin Subtitle Proxy Server

This proxy server bridges the gap between Jellyfin's external subtitle files and the React frontend by serving them with proper CORS headers.

## Why This Is Needed

Jellyfin stores external subtitles (`.srt`, `.sub`, etc.) as files on the server filesystem. These files are not directly accessible via Jellyfin's HTTP API. This proxy server:

1. **Fetches subtitle content** from Jellyfin's subtitle endpoints
2. **Converts SRT to VTT format** (adds WEBVTT header for HTML5 video compatibility)
3. **Adds CORS headers** so the React app can load subtitles from the browser
4. **Caches responses** to reduce repeated requests

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Running the Proxy Server

**Option A: Standalone**
```bash
npm start
```

**Option B: With Frontend (from root directory)**
```bash
npm run dev:with-proxy
```

This will start both:
- Subtitle proxy server on `http://localhost:3001`
- React dev server on `http://localhost:5173` (or next available port)

## Configuration

The proxy server defaults to:
- **Port**: `3001` (or `PORT` environment variable)
- **Origin**: All origins (CORS enabled for any domain)

To change the port:
```bash
PORT=4000 npm start
```

## How It Works

When the React player encounters an external subtitle:

1. **Player detects**: `subtitle.IsExternal === true`
2. **Constructs proxy URL**: 
   ```
   http://localhost:3001/api/subtitles?url=<jellyfin_url>&format=vtt
   ```
3. **Proxy fetches**: Requests the subtitle from Jellyfin server
4. **Converts format**: Adds `WEBVTT` header to SRT files
5. **Returns with CORS**: Browser can load and display subtitles

## API Endpoints

### `/api/subtitles`
Proxies subtitle requests from Jellyfin

**Parameters:**
- `url` (required): URL-encoded Jellyfin subtitle endpoint URL
- `format` (optional): Output format (`vtt` - default, or other)

**Example:**
```
GET http://localhost:3001/api/subtitles?url=http%3A%2F%2F192.168.1.100%3A8096%2FVideos%2F...&format=vtt
```

### `/health`
Health check endpoint

**Example:**
```
GET http://localhost:3001/health
# Response: { "status": "ok", "timestamp": "..." }
```

## Troubleshooting

### Subtitles still not loading?

1. **Check proxy is running**: `curl http://localhost:3001/health`
2. **Check browser console** for fetch errors
3. **Check server logs** for detailed error messages
4. **Verify Jellyfin connection**: Test subtitle URL directly in browser

### CORS errors?

The proxy server has CORS enabled for all origins by default. If you still see CORS errors, check:
- Proxy server is running
- Proxy URL in Player.tsx matches actual server address
- Jellyfin server is accessible from proxy server

## Architecture

```
React Frontend (localhost:5173)
    ↓ fetch subtitle
Proxy Server (localhost:3001)
    ↓ fetch from
Jellyfin Server (192.168.1.100:8096)
    ↓ (SRT file)
Proxy Server (converts to VTT, adds CORS headers)
    ↓ returns
React Frontend (loads in <video> element)
```

## Future Enhancements

- [ ] Subtitle format auto-detection
- [ ] SSA/ASS subtitle support
- [ ] PGS subtitle conversion
- [ ] Authentication passthrough to Jellyfin
- [ ] Caching strategies per subtitle type
- [ ] Database of converted subtitles
