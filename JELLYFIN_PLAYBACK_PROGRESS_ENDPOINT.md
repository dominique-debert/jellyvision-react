# Jellyfin `/Playback/Progress` Endpoint - Complete API Reference

## Overview

Based on the official Jellyfin Web client source code analysis, this document details the complete data structure and implementation for the `/Playback/Progress` endpoint.

## Endpoint Details

### Endpoint URL

```
POST /Playback/Progress
```

### Authentication

- Uses standard Jellyfin authentication via API key or access token
- No special headers required beyond Content-Type

## Complete POST Body Structure

The POST body is constructed from `PlayState` object and sent as JSON:

```typescript
{
  // REQUIRED - Item being played
  "ItemId": "string (UUID of the item)",

  // REQUIRED - Current playback position in ticks (100ns units)
  "PositionTicks": number (0-based ticks),

  // OPTIONAL - Session/Playback ID for tracking
  "PlaySessionId": "string or null",

  // OPTIONAL - Media source ID if using specific source
  "MediaSourceId": "string or null",

  // OPTIONAL - Audio stream index being used
  "AudioStreamIndex": number | null,

  // OPTIONAL - Subtitle stream index being used
  "SubtitleStreamIndex": number | null,

  // OPTIONAL - Secondary subtitle stream index
  "SecondarySubtitleStreamIndex": number | null,

  // OPTIONAL - Playback method (DirectPlay, DirectStream, Transcode)
  "PlayMethod": "DirectPlay" | "DirectStream" | "Transcode" | null,

  // OPTIONAL - Volume level (0-100)
  "VolumeLevel": number | null,

  // OPTIONAL - Is paused
  "IsPaused": boolean,

  // OPTIONAL - Is muted
  "IsMuted": boolean,

  // OPTIONAL - Repeat mode
  "RepeatMode": "RepeatNone" | "RepeatAll" | "RepeatOne" | null,

  // OPTIONAL - Shuffle mode
  "ShuffleMode": "Sorted" | "Shuffle" | null,

  // OPTIONAL - Maximum streaming bitrate (for transcoding)
  "MaxStreamingBitrate": number | null,

  // OPTIONAL - Playback start time in ticks
  "PlaybackStartTimeTicks": number | null,

  // OPTIONAL - Playback rate (1.0 = normal)
  "PlaybackRate": number | null,

  // OPTIONAL - Live stream ID
  "LiveStreamId": "string or null",

  // OPTIONAL - Playlist item ID (internal tracking)
  "PlaylistItemId": "string or null",

  // OPTIONAL - Buffered ranges (for progress indication)
  "BufferedRanges": [
    { "start": number, "end": number },
    // ... more ranges
  ] | null,

  // OPTIONAL - Event name (timeupdate, pause, unpause, etc.)
  "EventName": "timeupdate" | "pause" | "unpause" | "volumechange" | null,

  // OPTIONAL - Now playing queue (if reportPlaylist is true)
  "NowPlayingQueue": [
    {
      "Id": "string (item ID)",
      "PlaylistItemId": "string (playlist item ID)",
      "ServerId": "string (only if different from current)" // optional
    }
  ] | null
}
```

## Key Implementation Details

### 1. PlaySessionId

**Source:** Extracted from the media streaming URL during playback setup

```javascript
// From createStreamInfo function in playbackmanager.js
playSessionId: getParam("playSessionId", mediaUrl);
```

**How it's obtained:**

- Generated when creating the stream URL for playback
- Retrieved as a query parameter from the media URL
- Persists for the entire playback session
- Used to track which session is sending the progress update

**Example:** If the stream URL is:

```
/Videos/itemId/stream?playSessionId=12345678&...
```

Then `PlaySessionId` = "12345678"

### 2. PlayState Object Structure

From `src/types/playbackStopInfo.ts`:

```typescript
export interface PlayState extends PlayerStateInfo {
  ShuffleMode?: GroupShuffleMode;
  MaxStreamingBitrate?: number | null;
  PlaybackStartTimeTicks?: number | null;
  PlaybackRate?: number | null;
  SecondarySubtitleStreamIndex?: number | null;
  BufferedRanges?: BufferedRange[];
  PlaySessionId?: string | null;
  PlaylistItemId?: string | null;
}
```

### 3. Construction Process

The progress data is built in `reportPlayback` function:

```javascript
function reportPlayback(
  playbackManagerInstance,
  state,
  player,
  reportPlaylist,
  serverId,
  method,
  progressEventName
) {
  // Copy entire PlayState
  const info = Object.assign({}, state.PlayState);

  // Add ItemId
  info.ItemId = state.NowPlayingItem.Id;

  // Add event name if progress update
  if (progressEventName) {
    info.EventName = progressEventName;
  }

  // Add playlist if requested
  if (reportPlaylist) {
    addPlaylistToPlaybackReport(
      playbackManagerInstance,
      info,
      player,
      serverId
    );
  }

  // Send to server
  const apiClient = ServerConnections.getApiClient(serverId);
  apiClient[method](info); // method = 'reportPlaybackProgress'
}
```

### 4. Full PlayState Object Population

From `getPlayerState` method in playbackmanager.js:

```javascript
state.PlayState.VolumeLevel = player.getVolume();
state.PlayState.IsMuted = player.isMuted();
state.PlayState.IsPaused = player.paused();
state.PlayState.RepeatMode = self.getRepeatMode(player);
state.PlayState.ShuffleMode = self.getQueueShuffleMode(player);
state.PlayState.MaxStreamingBitrate = self.getMaxStreamingBitrate(player);
state.PlayState.PositionTicks = getCurrentTicks(player);
state.PlayState.PlaybackStartTimeTicks = self.playbackStartTime(player);
state.PlayState.PlaybackRate = self.getPlaybackRate(player);
state.PlayState.SubtitleStreamIndex = self.getSubtitleStreamIndex(player);
state.PlayState.SecondarySubtitleStreamIndex =
  self.getSecondarySubtitleStreamIndex(player);
state.PlayState.AudioStreamIndex = self.getAudioStreamIndex(player);
state.PlayState.BufferedRanges = self.getBufferedRanges(player);
state.PlayState.PlayMethod = self.playMethod(player);
state.PlayState.LiveStreamId = mediaSource.LiveStreamId;
state.PlayState.PlaySessionId = self.playSessionId(player);
state.PlayState.PlaylistItemId = self.getCurrentPlaylistItemId(player);
state.PlayState.MediaSourceId = mediaSource.Id;
state.PlayState.CanSeek =
  (mediaSource.RunTimeTicks || 0) > 0 || canPlayerSeek(player);
```

## HTTP Request Example

```http
POST /Playback/Progress HTTP/1.1
Host: jellyfin.example.com
Content-Type: application/json
Authorization: Bearer <token>

{
  "ItemId": "abc123def456",
  "PositionTicks": 123456789,
  "PlaySessionId": "1672940000000",
  "MediaSourceId": "primary",
  "PlayMethod": "DirectPlay",
  "VolumeLevel": 100,
  "IsPaused": false,
  "IsMuted": false,
  "RepeatMode": "RepeatNone",
  "PlaybackRate": 1.0,
  "AudioStreamIndex": 0,
  "SubtitleStreamIndex": -1,
  "EventName": "timeupdate",
  "PlaybackStartTimeTicks": 0,
  "NowPlayingQueue": [
    {
      "Id": "abc123def456",
      "PlaylistItemId": "queue_item_1"
    }
  ]
}
```

## Event Names

Progress updates are sent with different `EventName` values depending on the trigger:

```javascript
// Progress update (every ~10 seconds via timer)
reportPlayback(..., 'reportPlaybackProgress', 'timeupdate');

// Playback paused
reportPlayback(..., 'reportPlaybackProgress', 'pause');

// Playback unpaused/resumed
reportPlayback(..., 'reportPlaybackProgress', 'unpause');

// Volume changed
reportPlayback(..., 'reportPlaybackProgress', 'volumechange');

// Repeat mode changed
reportPlayback(..., 'reportPlaybackProgress', 'repeatmodechange');

// Shuffle mode changed
reportPlayback(..., 'reportPlaybackProgress', 'shufflequeuemodechange');

// Playlist item moved
reportPlayback(..., 'reportPlaybackProgress', 'playlistitemmove');

// Item removed from playlist
reportPlayback(..., 'reportPlaybackProgress', 'playlistitemremove');

// Item added to playlist
reportPlayback(..., 'reportPlaybackProgress', 'playlistitemadd');
```

## Progress Update Intervals

```javascript
// Main progress timer: sends update every 10 seconds
player._progressInterval = setInterval(
  onPlayerProgressInterval.bind(player),
  10000
);

// Also sends on:
// - timeupdate events
// - pause events
// - unpause events
// - volume changes
// - repeat mode changes
// - shuffle mode changes
// - playlist modifications
```

## NowPlayingQueue Structure

When `reportPlaylist` is true, the `NowPlayingQueue` is populated:

```javascript
function addPlaylistToPlaybackReport(
  playbackManagerInstance,
  info,
  player,
  serverId
) {
  info.NowPlayingQueue = getPlaylistSync(playbackManagerInstance, player).map(
    function (i) {
      const itemInfo = {
        Id: i.Id,
        PlaylistItemId: i.PlaylistItemId,
      };

      // Only include if different server
      if (i.ServerId !== serverId) {
        itemInfo.ServerId = i.ServerId;
      }

      return itemInfo;
    }
  );
}
```

## API Client Methods

In Jellyfin API client (`apiclient.d.ts`):

```typescript
// Method signatures
reportPlaybackProgress(options: PlaybackProgressInfo): Promise<void>;
reportPlaybackStart(options: PlaybackStartInfo): Promise<void>;
reportPlaybackStopped(options: PlaybackStopInfo): Promise<void>;
```

## Special Handling

### 1. No Query Parameters

The `/Playback/Progress` endpoint uses **POST body only** - no query parameters are sent.

### 2. Standard Headers

```
Content-Type: application/json
Authorization: <standard Jellyfin auth>
```

### 3. No Special Headers

- No X-MediaBrowser headers needed
- No special content negotiation
- Standard REST POST semantics

### 4. LiveStreamId Handling

For live streams, the `LiveStreamId` is included and media info is refreshed every 600+ seconds:

```javascript
if (
  streamInfo?.liveStreamId &&
  new Date().getTime() - (streamInfo.lastMediaInfoQuery || 0) >= 600000
) {
  getLiveStreamMediaInfo(
    player,
    streamInfo,
    self.currentMediaSource(player),
    streamInfo.liveStreamId,
    serverId
  );
}
```

## Implementation Notes for Your Code

1. **Always include ItemId** - This is required and extracted from the now playing item
2. **PositionTicks is in 100-nanosecond units** - Multiply seconds by 10,000
3. **PlaySessionId persistence** - Extract once from URL and reuse for entire session
4. **Optional fields** - Most fields are nullable/optional but recommended for full server sync
5. **Event batching** - The client sends one update with EventName per trigger, not multiple
6. **Playlist tracking** - Include NowPlayingQueue for full playlist tracking on the server
7. **Timestamp format** - PositionTicks uses ticks (100ns), not milliseconds or seconds

## References

- **Source File:** `src/components/playback/playbackmanager.js` (lines 74-100, 2184-2216, 3671-3694)
- **Type Definitions:** `src/types/playbackStopInfo.ts`
- **API Client:** `src/apiclient.d.ts` (lines 235-250)
- **Endpoint Method:** `reportPlaybackProgress` in ApiClient class
