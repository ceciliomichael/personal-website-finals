# Architecture

## Workspace

- `new-portfolio-ko/`: the only active portfolio app. Next.js 16 App Router, TypeScript, Tailwind CSS v4, Framer Motion, Lucide, React Icons, react-zoom-pan-pinch, and PostgreSQL.
- Root `docker-compose.yml`: production-capable stack with PostgreSQL 17 (persistent named volume, localhost-only DB port), an automatic one-shot SQL migration service with no host bind mounts, and a health-checked Next.js app.
- `new-portfolio-ko/Dockerfile`: multi-stage Node.js 22 Alpine build producing the Next.js standalone server, running as a non-root user; `.dockerignore` excludes local files and secrets.
- `new-portfolio-ko/Dockerfile.migrate`: PostgreSQL client image with bundled SQL migrations for managed Compose deployment hosts such as RouteGate that disallow source-directory bind mounts.
- `new-portfolio-ko/src/app/api/health/route.ts`: health endpoint that verifies the application can query PostgreSQL, used by the container healthcheck.

## Implemented UI architecture

- `src/app/page.tsx`: renders `PortfolioExperience`.
- `src/app/layout.tsx`: page metadata and shared styles.
- `src/app/globals.css`: Tailwind v4 tokens, typography, focus states, baseline styling.
- `src/styles/animations.css`: nebula flight, responsive galaxy map, decorative starfield and glass surfaces.
- `src/components/portfolio/SpaceBackdrop.tsx`: deterministic starfield/aurora backdrop.
- `src/components/portfolio/WelcomeScreen.tsx`: first-visit name entry and visitor profile creation, without passwords.
- `src/components/portfolio/NebulaJourney.tsx`: timed full-screen flight, moving stars, expanding nebula, progress/status, reduced-motion support.
- `src/components/portfolio/PortfolioExperience.tsx`: restores a saved visitor session, controls welcome → journey → galaxy and the full-screen profile, tracks persisted achievements, and manages section selection.
- `src/components/portfolio/ExploreGalaxy.tsx`: constellation explorer, Profile button, direct node selection, gentle wheel zoom, animated zoom controls, and smooth zoom reset on dialog close.
- `src/components/portfolio/ProfileScreen.tsx`: full-screen visitor profile with public-to-owner `#number`, icon-only name save, discovery stats, and unlocked/locked achievement milestones.
- `src/components/portfolio/ConstellationMap.tsx`: coordinates, paths, nodes, mobile vertical track and atmospheric stars.
- `src/components/portfolio/SectionModal.tsx`: accessible color-aware modal shell, editorial rail, shared dismiss/focus handling, and section routing.
- `src/components/portfolio/SectionModalNarratives.tsx`: About portrait/profile mosaic, AI Expertise and Development timelines, and the Skills capability dashboard.
- `src/components/portfolio/SectionModalShowcases.tsx`: Projects, Hobbies, Goals, and Gallery editorial compositions.
- `src/components/portfolio/FeedbackFeed.tsx`: public feedback feed, one post per visitor, three server-enforced edits, live updates.
- `src/components/portfolio/LobbyChat.tsx`: live shared chat, most recent 20 messages, inline composer without a second floating card.
- `src/components/portfolio/PortfolioExperience.tsx`: also sends best-effort presence heartbeats while a named visitor is on the site.
- `src/components/portfolio/useCommunityUpdates.ts`: one shared browser event-stream subscription pattern with automatic reconnection and fallback refresh.
- `src/components/portfolio/AchievementToast.tsx`: local achievement feedback.
- `src/data/portfolio.ts`: typed content and existing project data, original constellation categories and positions.
- `public/images/profile/` and `public/images/gallery/`: copies of original static photos; images are not database blobs.

## Backend status

PostgreSQL persists anonymous visitor profiles, globally increasing visitor numbers, visited sections, unlocked achievements, public feedback, and the latest 20 lobby messages. The browser keeps a secret UUID v4 session token in localStorage, while only its SHA-256 hash is stored in PostgreSQL. Names need not be unique; each visitor sees their own `#number` on the profile screen, and public feedback and lobby posts are attributed as `Name#number` without exposing the secret session credential. The public feed APIs join author names and global visitor numbers from PostgreSQL, so previously posted content reflects subsequent display-name changes. The API handles profile creation/restore/renaming, section visits, public feedback (one post and at most three edits per visitor), and lobby messages (one-second per-visitor cooldown; 20 globally retained messages).

Backend code: `src/lib/{db,visitors,visitor-client,community,community-client,feedback,lobby,realtime}.ts`, `src/app/api/visitors/**`, `src/app/api/{feedback,lobby,events}/**`, and `scripts/migrate-db.mjs`. Migrations are `db/001_visitors.sql` and `db/002_feedback_lobby.sql`. Server-Sent Events (SSE) broadcast changes through a long-lived PostgreSQL `LISTEN/NOTIFY` connection across app processes; streaming clients refetch the public API, with reconnection and fallback refresh. Deploy on a Node host supporting persistent connections. No password registration or cross-device account recovery is implemented. No WebSocket server is needed for these one-way event notifications.

The Lobby's **Online** badge counts distinct named visitor profiles active within the last 60 seconds, across all pages of the site. The app sends an authenticated heartbeat every 15 seconds while visible. `src/lib/presence.ts`, `src/app/api/presence/route.ts`, and `db/003_presence.sql` implement the count and expiring presence records. PostgreSQL notifications broadcast joins and expirations; the lobby also refreshes its count every 15 seconds so departures appear after expiry. Welcome-screen visitors without a saved profile are not counted. Lobby storage still caps at 20 messages, but the UI does not advertise this cap.

## Running

Production Docker deployment: configure root `.env` based on `.env.example`, then run `docker compose up -d --build --wait` from the workspace root. The app listens on `APP_PORT` (default 3000); the database is accessed internally as `postgres:5432`. The migration container applies versioned SQL scripts before the app starts, and Next.js runs in standalone production mode. Deploy behind an HTTPS reverse proxy that supports long-lived SSE connections and does not buffer event streams. See `new-portfolio-ko/README.md`.

From the repository root, configure `.env` and `new-portfolio-ko/.env.local`, then run `docker compose up -d --wait postgres`. In `new-portfolio-ko`, run `npm install`, `npm run db:migrate`, then `npm run dev`. Run `npm run lint`, `npm run build`, `npm run test:visitors`, `npm run test:presence`, and `npm run test:community` (the community test requires an empty local lobby) to verify. See `new-portfolio-ko/README.md`.
