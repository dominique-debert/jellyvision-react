# Album Playback Guide

## Overview

The music player now supports full album playback. When you click the play button on an album, it will stream and play all tracks in the album sequentially.

## How It Works

### 1. Album Detection

When the AudioPlayer loads an item:

- It checks if the item type is `"MusicAlbum"`
- If it's an album, it automatically fetches all tracks using `getAlbumTracks()`
- Tracks are stored in the `albumTracks` state

### 2. Track Sequencing

- **Current Track Index**: Tracks are played based on `currentTrackIndex`
- **Auto-Advance**: When a track ends, `handleEnded()` automatically advances to the next track
- **Next/Previous Buttons**: Skip buttons now navigate between album tracks instead of seeking forward/back
  - With album: Forward = next track, Back = previous track
  - Without album: Forward = +10 seconds, Back = -10 seconds

### 3. Album Display

The player shows:

- Album art from the album (cached via `getImageUrl()`)
- Current track name and artist
- Track counter: "Track X of Y"
- Album name below the track info

### 4. Repeat Modes

- **Off**: Stops after last track
- **All**: Loops back to first track after the last one
- **One**: Repeats current track infinitely

## File Changes

### AudioPlayer.tsx

- Added `albumTracks` state to store all album tracks
- Added `currentTrackIndex` state for track position
- Updated `getStreamUrl()` to play current album track
- Added `handleEnded()` handler for track auto-advance
- Updated skip buttons to navigate tracks in albums
- Enhanced UI to show track counter and current track name
- Added `onEnded` event to audio element

### MusicDetail.tsx

- Album art play button now passes album ID (`item.Id`) instead of first track ID
- This triggers the AudioPlayer to load the entire album
- Individual track play buttons still work for single track playback

## API Endpoints Used

- `GET /Audio/{trackId}/stream` - Stream individual audio file
- `GET /Items/{itemId}` - Get item metadata (to detect if it's an album)
- `GET /Items/{albumId}/Children` - Get all tracks in an album (via `getAlbumTracks()`)
- `GET /Items/{itemId}/Images/Primary` - Get album artwork

## User Experience Flow

1. User navigates to an album in the music library
2. Album art displays with a play button on hover
3. Click play button → AudioPlayer opens with full album loaded
4. First track starts playing automatically
5. Use skip buttons to navigate between tracks
6. When track ends, next one plays automatically
7. Last track loops or stops based on repeat mode

## Testing Checklist

- [ ] Album art displays correctly
- [ ] Play button appears on hover
- [ ] Album loads all tracks when clicked
- [ ] First track plays automatically
- [ ] Track counter shows "1 of N"
- [ ] Skip forward goes to next track
- [ ] Skip back goes to previous track
- [ ] Track advances automatically on end
- [ ] Track name updates in UI
- [ ] Repeat modes work correctly
- [ ] Individual track play buttons still work

## Known Behavior

- Album ID is used for streaming the entire album
- Jellyfin API returns all tracks when querying album `/Children` endpoint
- Progress bar resets when track changes (expected HTML5 audio behavior)
- Volume is maintained across track changes
- Play/pause state is reset between tracks (user must click play again or enable autoplay)
