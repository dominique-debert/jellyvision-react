# Jellyvision Subtitle Proxy - Setup Guide

## Architecture

The subtitle proxy enables external SRT/SUB subtitle files from Jellyfin to be loaded in the React video player:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Video Player                        │
│                   (localhost:5175)                           │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch subtitle
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Subtitle Proxy Server                           │
│                (localhost:3001)                              │
│  • Receives subtitle request with Jellyfin URL              │
│  • Converts SRT → VTT format                                │
│  • Adds CORS headers                                         │
│  • Returns to browser                                        │
└────────────────────────┬────────────────────────────────────┘
                         │ fetch from
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Jellyfin Media Server                           │
│              (192.168.1.100:8096)                            │
│  • Stores external SRT files on filesystem                  │
│  • Returns subtitle content via HTTP                        │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Running Both Services

**Option A: In Separate Terminals**

Terminal 1 - Subtitle Proxy Server:

```bash
cd server
node index.js
# Listens on http://localhost:3001
```

Terminal 2 - React Frontend:

```bash
pnpm dev
# Listens on http://localhost:5175 (or next available port)
```

**Option B: Concurrently (requires concurrently package)**

```bash
npm install -D concurrently
npm run dev:with-proxy
```

### 3. Verify Setup

Check proxy health:

```bash
curl http://localhost:3001/health
# Response: {"status":"ok","timestamp":"..."}
```

## How It Works

### When playing a video with external subtitles:

1. **Player detects external subtitle:**

   ```
   {
     "IsExternal": true,
     "Path": "/data/movies/movie.eng.srt",
     "Codec": "subrip",
     "Language": "eng"
   }
   ```

2. **Player constructs proxy URL:**

   ```
   http://localhost:3001/api/subtitles?url=http%3A%2F%2F192.168.1.100%3A8096%2FVideos%2F...&format=vtt
   ```

3. **Proxy fetches from Jellyfin:**

   - Calls: `http://192.168.1.100:8096/Videos/{id}/Subtitles/{index}/stream?api_key=...`
   - Receives SRT content from file server

4. **Proxy processes:**

   - Reads SRT file content
   - Adds `WEBVTT` header (SRT → VTT conversion)
   - Sets CORS headers: `Access-Control-Allow-Origin: *`
   - Caches result for 24 hours

5. **Browser displays subtitles:**
   - Receives VTT content via CORS
   - Loads into `<video>` element's text track
   - Renders subtitles during playback

## Configuration

### Proxy Server Port

Default: `3001`

To change:

```bash
PORT=4000 node server/index.js
```

### Player Proxy URL

In `src/pages/Player.tsx`, the proxy URL is hardcoded:

```typescript
const proxyUrl = `http://localhost:3001/api/subtitles`;
```

To change server address/port, modify this line.

## Troubleshooting

### Proxy server won't start

1. **Check port not in use:**

   ```bash
   lsof -i :3001
   # Kill the process if needed: kill -9 <PID>
   ```

2. **Check dependencies installed:**
   ```bash
   cd server && npm install
   ```

### Subtitles still not loading

1. **Check browser console** for fetch errors
2. **Check proxy logs** - should show requests:
   ```
   Proxying subtitle request: http://192.168.1.100:8096/Videos/...
   ```
3. **Test proxy directly:**
   ```bash
   curl "http://localhost:3001/health"
   # Should return: {"status":"ok","timestamp":"..."}
   ```

### CORS errors in browser

- Verify proxy server is running
- Verify player proxy URL matches server address
- Check network tab in DevTools for actual proxy request

## API Endpoints

### `GET /api/subtitles`

Proxy endpoint for subtitle files

**Parameters:**

- `url` (required): URL-encoded Jellyfin subtitle endpoint
- `format` (optional): Output format (default: `vtt`)

**Response:**

- Content-Type: `text/vtt; charset=utf-8`
- Cache-Control: `public, max-age=86400`
- Body: VTT subtitle content

**Example:**

```bash
curl "http://localhost:3001/api/subtitles?url=http%3A%2F%2F192.168.1.100%3A8096%2FVideos%2F15038b52760ef12369c91e7bdd42a496%2FSubtitles%2F0%2Fstream%3Fapi_key%3D..."
```

### `GET /health`

Health check endpoint

**Response:**

```json
{ "status": "ok", "timestamp": "2026-01-08T16:35:00.000Z" }
```

## Files Modified

1. **server/index.js** - New proxy server
2. **server/package.json** - Server dependencies
3. **server/README.md** - Server documentation
4. **src/pages/Player.tsx** - Updated to use proxy for external subtitles
5. **package.json** - Added `dev:with-proxy` script

## Next Steps

### Optional Enhancements

- [ ] Add authentication pass-through to Jellyfin
- [ ] Support for SSA/ASS subtitles (via SubtitlesOctopus)
- [ ] Support for PGS subtitles
- [ ] Database of converted subtitles to avoid re-processing
- [ ] Docker image for easy deployment
- [ ] Environment configuration for server URL

### Testing

Try playing a video with external subtitles:

1. Navigate to library
2. Click a movie with SRT subtitles
3. Check console for subtitle loading logs
4. Verify subtitles appear in video

## Support

For issues or questions:

1. Check server logs
2. Check browser console (DevTools)
3. Verify Jellyfin connection
4. Check network requests in DevTools Network tab
