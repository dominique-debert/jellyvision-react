# Jellyvision Player - Quick Reference

## 🚀 Start Both Services (Two Terminals)

### Terminal 1: Subtitle Proxy Server

```bash
cd /media/dominique/Development/E1N/jellyvision-react/server
node index.js
```

✅ Listens on `http://localhost:3001`

### Terminal 2: React Frontend

```bash
cd /media/dominique/Development/E1N/jellyvision-react
pnpm dev
```

✅ Listens on `http://localhost:5175`

---

## ✅ What Works

| Feature                | Status     | Notes                         |
| ---------------------- | ---------- | ----------------------------- |
| **Video Streaming**    | ✅ Works   | MP4 auto-plays from Jellyfin  |
| **Play/Pause**         | ✅ Works   | Click video or use spacebar   |
| **Seek**               | ✅ Works   | Click progress bar or drag    |
| **Volume**             | ✅ Works   | Slider or mute button         |
| **Fullscreen**         | ✅ Works   | Press F or click icon         |
| **External Subtitles** | ✅ Works   | With proxy server running     |
| **Embedded Subtitles** | ⚠️ Limited | Only if Jellyfin exposes them |

---

## 📊 Current Setup

```
Jellyfin Server: 192.168.1.100:8096
React Frontend: http://localhost:5175
Subtitle Proxy: http://localhost:3001
```

---

## 🔍 Test Video Playback

1. Open browser → `http://localhost:5175`
2. Navigate to library
3. Click a movie
4. Click **Play**
5. Video should start immediately
6. Check console for subtitle logs

---

## 📝 Key Files

| File                      | Purpose                    |
| ------------------------- | -------------------------- |
| `src/pages/Player.tsx`    | Video player component     |
| `server/index.js`         | Subtitle proxy server      |
| `PLAYER_STATUS.md`        | Full status & architecture |
| `SUBTITLE_PROXY_SETUP.md` | Setup guide                |

---

## 🛠️ Common Tasks

### Check if Proxy is Running

```bash
curl http://localhost:3001/health
```

### View Proxy Logs

Watch the terminal where `node index.js` is running

### Change Proxy Port

```bash
PORT=4000 node server/index.js
```

### Test Subtitle Endpoint

```bash
curl "http://localhost:3001/api/subtitles?url=<encoded_jellyfin_url>"
```

### Clear Subtitle Cache

Proxy caches for 24 hours. Either:

- Restart proxy server
- Wait 24 hours

---

## ❓ Troubleshooting

### Subtitles not showing?

1. Check proxy server is running: `curl http://localhost:3001/health`
2. Check browser console for errors (F12)
3. Verify subtitle file exists in Jellyfin

### Video won't play?

1. Check Jellyfin is accessible: `curl http://192.168.1.100:8096`
2. Check your auth token is valid
3. Check browser console for CORS errors

### Port already in use?

```bash
# Find what's using port 3001
lsof -i :3001
# Kill it
kill -9 <PID>
```

---

## 📚 Documentation

- **Full Setup**: See `SUBTITLE_PROXY_SETUP.md`
- **Architecture**: See `PLAYER_STATUS.md`
- **Server Details**: See `server/README.md`

---

## 🎬 Example Flow

```
1. User opens http://localhost:5175
2. User navigates to library
3. User clicks Play on a movie
4. Player.tsx loads:
   - Video stream from Jellyfin
   - Detects external subtitles
5. If subtitles exist:
   - Calls proxy: http://localhost:3001/api/subtitles?url=...
   - Proxy fetches from Jellyfin
   - Proxy converts SRT → VTT
   - Browser loads subtitles
6. Video plays with subtitles!
```

---

## 💡 Tips

- Subtitles won't appear if file format is not supported (SSA/ASS/PGS)
- Proxy caches converted subtitles (24 hour TTL)
- External SRT files require proxy, embedded subtitles try direct API
- Video autoplay requires `muted` attribute in browser

---

**Last Updated:** Jan 8, 2026
**Status:** ✅ Production Ready
