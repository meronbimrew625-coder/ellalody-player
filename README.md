# Ellalody — Next.js Music Player

A bright, responsive music discovery/player starter built with **Next.js App Router**. It uses Next.js route handlers for provider requests, reusable UI components, browser storage for favorites/playlists, and a persistent audio player shell.

## Features
- Responsive dark interface with lime accents, desktop sidebar, mobile navigation, toast feedback, and loading/empty/error states.
- Music search via the public Apple/iTunes Search API (`/api/music`). It returns preview clips when the provider makes a preview available; these are not full-length commercial tracks.
- Optional Jamendo independent-music search (`/api/music/jamendo`).
- Play/pause, previous/next, seek, volume, shuffle, repeat, keyboard space/arrow controls, and queue.
- Favorites and custom playlists persisted in localStorage.
- Routes: `/`, `/explore`, `/search`, `/favorites`, `/playlists`, `/menu`, `/moods` (also `/mood-mix`), `/stats`, `/quiz`, `/signin`, `/signup`, and `/vault`.

## Requirements
- Node.js 20.9 or newer
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Music providers
### Apple/iTunes (default)
No API key is needed for the public search endpoint. The app calls its own Next.js route at `/api/music`, which requests song metadata and preview URLs from `https://itunes.apple.com/search`. Only results with preview URLs are shown. Availability and results may vary by region and track.

### Jamendo (optional)
1. Create an app at https://devportal.jamendo.com/ and obtain a client ID.
2. Copy `.env.example` to `.env.local`.
3. Set `JAMENDO_CLIENT_ID=your_real_client_id` in `.env.local`.
4. Restart `npm run dev`, then choose **Jamendo indie** in Explore.

Jamendo access, API limits, and music licenses are subject to its current developer terms. Do not assume every track is cleared for every use.

## Notes
- Next.js uses React under the hood; this is a Next.js App Router project, not a separate Vite project.
- The player plays preview audio provided by the catalog. This project does not unlock full-length or DRM-protected tracks.
- User favorites and playlists are stored in the current browser only; no account/backend sync is included.
- Provider APIs can change or rate-limit requests. Error states are included, but a successful production build/live provider response should be tested in your environment.

## Extra frontend features

- **Mood Mix** (`/moods`): choose a mood and discover tracks using mood-themed catalog searches.
- **Listening Stats** (`/stats`): counts play starts, tracks listening time while playback is active, and ranks most-played tracks. Stats are stored in this browser's local storage.
- **Song Quiz** (`/quiz`): a five-question song-title quiz using available music preview clips.
- **Sleep Timer**: use the clock icon in the bottom player bar or the Sleep Timer panel in `/menu` to stop playback after 5, 10, 15, 30, 45, or 60 minutes, or cancel the timer.

The features use the existing music catalog and browser storage. Listening stats are local to the browser and are not synchronized between devices. The sleep timer runs while the page is open. A real encrypted private media vault that hides files from the device's Gallery or File Explorer is not included: that needs a native app layer and secure local file storage, not just a Next.js website.

## Update the existing Vercel deployment

1. Extract this ZIP and copy the updated project into the local folder connected to your existing GitHub repository.
2. Run `npm install` and `npm run build` to test locally.
3. Commit and push the changes to the same GitHub repository and deployment branch used by your current Vercel project.
4. Vercel should deploy the new commit automatically while keeping the existing project URL, as long as you do not create a new Vercel project or change the domain.

- **Required sign-in/sign-up gate** (`/signin`, `/signup`): visitors without a local demo session are sent to sign in or create an account before using the music pages. Account records and a derived password hash are kept in browser localStorage only. This is a learning/demo flow, not real authentication; browser storage can be inspected or changed and accounts do not sync.
- **Private browser vault** (`/vault`): selected audio/video files are encrypted as copies with Web Crypto AES-GCM and saved in IndexedDB. This does **not** hide or delete the originals from the device Gallery or File Explorer. A native app or OS-level integration is required for that. If the vault password is lost, the encrypted copies cannot be recovered.
- **Mood Mix route compatibility**: `/moods` and `/mood-mix` both open the mood discovery page.
- **Song Quiz**: creates questions from tracks that include playable preview URLs. It cannot run a full round if the provider returns fewer than four preview tracks.
- The API route handlers no longer declare `dynamic = 'force-dynamic'`, which conflicts with `cacheComponents` in newer Next.js versions.

## Project organization and capstone notes

Reusable React UI components are in `components/` and use `.jsx`. Next.js routes and API handlers remain in `app/`. Styling uses regular CSS in `app/globals.css`; Tailwind is not used.

See `PROJECT_STRUCTURE.md`, `AUTH.md`, `DATA.md`, `PERF.md`, and `FUTURE.md` for the project map, current demo authentication limitations, data handling, testing checklist, and planned improvements. The sign-in/sign-up screens are included, but they are browser-only demonstrations rather than secure production authentication.

## Latest interface updates
- Theme selector in the top bar: Light, Dark, Red, and Blue. The selected theme is saved in browser local storage.
- Song Quiz pauses the active preview when moving to the next question.
- The former Private Vault is labeled Privacy Folder throughout the interface. It stores encrypted copies in browser storage; it does not hide or remove originals from the device.
- A visible site footer appears below each authenticated page's content, separate from the fixed music player.

## Additional features in this package

- Albums page groups loaded tracks by available album and artist metadata.
- Videos page imports user-selected video files and plays them in the browser using the HTML video player.
- Sleep timer is available in the persistent player and pauses playback when the timer expires while the page is running.
- Sign In / Sign Up are a frontend demo flow. Do not use real passwords or present this as production-secure authentication without a trusted auth provider/backend.
- Privacy Folder encrypts selected files in browser storage, but does not hide the original files from the operating system's Gallery or File Explorer.

## Local media limitations

Browsers cannot silently scan all device folders. Users must select files/folders through the browser permission flow. The Videos page currently keeps imported object URLs in the active session; select videos again after refreshing. Browser suspension can delay a sleep timer. These browser limits are not solved by a frontend-only Next.js website.
