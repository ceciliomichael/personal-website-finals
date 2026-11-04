# ORBITAL Portfolio

This is the active Next.js portfolio. Visitors enter a name once, travel through the nebula animation, and explore the galaxy. Subsequent visits in the same browser restore the saved visitor profile and start directly with the nebula journey.

## Deploy the complete application with Docker

From the repository root (the directory containing `docker-compose.yml`):

1. Copy `.env.example` to `.env` and set a long, random, **URL-safe** `POSTGRES_PASSWORD` (letters and numbers work). Adjust `APP_PORT` if port 3000 is already occupied, and optionally set `APP_BIND_ADDRESS=127.0.0.1` when using a reverse proxy on the same host.
2. Build and start the complete stack:

   ```sh
   docker compose up -d --build --wait
   ```

3. Open `http://localhost:3000` (or the configured port). Check services and database-backed readiness:

   ```sh
   docker compose ps
   docker compose logs -f app
   curl http://localhost:3000/api/health
   ```

The `postgres` container keeps visitor profiles, feedback, and chat in the persistent `orbital_postgres_data` named volume. The one-shot `migrate` service builds `Dockerfile.migrate` with SQL files bundled into the image (no host bind mounts, compatible with RouteGate's Compose restrictions), waits for a healthy database, applies `db/001_visitors.sql`, `db/002_feedback_lobby.sql`, and `db/003_presence.sql`, then exits successfully before `app` starts. Migration errors prevent the app from starting. The `app` image builds Next.js once and runs its standalone production server as a non-root user; it checks `/api/health` to monitor database connectivity.

For subsequent deployments, run `docker compose up -d --build --wait`. When adding new SQL migration files to the existing deployment, explicitly run `docker compose run --rm migrate` before restarting the app to ensure that the scripts are applied.

For a public domain, route HTTPS traffic from your reverse proxy or tunnel to the configured app port. Enable streaming and disable response buffering for `/api/events` so live feedback, Lobby messages, and Online counts continue updating. The database port is only published on localhost for administration and local development. Do not publish PostgreSQL to the internet, and do not commit the root `.env` file or local `.env.local`.

To stop without losing data, run `docker compose down`. Do not run `docker compose down -v` unless you intentionally want to destroy the PostgreSQL volume.

## Requirements

- Node.js 22+ and npm
- Docker Desktop / Docker Compose

## Local setup

From the repository root (`portfolio-port`):

1. Copy `.env.example` to `.env` and choose a long, random `POSTGRES_PASSWORD`.
2. Copy `new-portfolio-ko/.env.local.example` to `new-portfolio-ko/.env.local`, then set `DATABASE_URL` to match the PostgreSQL credentials and port.
3. Start the database:

   ```sh
   docker compose up -d --wait postgres
   ```

From `new-portfolio-ko`:

```sh
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000` or the URL Next.js reports.

The root Compose file exposes PostgreSQL only on `127.0.0.1:5432`. Data is persisted in the named Docker volume `orbital_postgres_data`. Stop the service with `docker compose down` from the root. Do not use `docker compose down -v` unless you intend to delete database data.

Both local environment files are ignored by Git. Do not commit database credentials.

## Visitor profiles and progress

- Each new visitor gets a server-generated UUID and a unique **global visitor number**. Numbering is independent of display names; duplicate names are allowed.
- The visitor sees their own global number as `#1`, `#2`, etc. on the full-screen Profile page. Their session token is never shown.
- A random UUID v4 session credential is kept in browser `localStorage`. PostgreSQL stores its SHA-256 hash rather than the credential itself.
- Returning visitors are automatically restored through `GET /api/visitors/me`, then see the nebula journey. A missing or invalid session returns to the name screen.
- On the full-screen Profile page, the large name is directly editable. The adjacent icon-only save button updates the name without creating a new visitor. Visited sections and achievements are saved in PostgreSQL, including Trailblazer (3 sections), First Transmission (first lobby message), and Feedback Giver (first feedback post).
- This is an **anonymous, browser-bound profile**, not a password-based account. Anyone with the session credential can access the associated profile; clearing localStorage loses automatic profile access. There is no cross-device recovery.

## Public feedback and live lobby

- **Feedback:** Visitors may publish one public post (up to 1,600 characters) and edit it at most three times. This limit is enforced atomically in PostgreSQL, even with concurrent requests. Posts are displayed most recent first; the public endpoint returns the latest 100.
- **Lobby:** A shared chat with up to 500 characters per message. Only the latest 20 messages remain stored globally. The server enforces a one-second cooldown per visitor between messages.
- **Online presence:** The Lobby header displays the current count of distinct named visitor profiles active on the site. Heartbeats are sent about every 15 seconds while a browser tab is visible, and a profile is considered offline after 60 seconds without a heartbeat. PostgreSQL broadcasts joins/expiry through the existing event stream; the lobby reconciles the count every 15 seconds. Visitors who have not yet entered a name are not included.
- **Realtime:** Both features use browser Server-Sent Events (`/api/events`) and PostgreSQL `LISTEN/NOTIFY`. When someone posts or edits, connected clients fetch the updated feed immediately. EventSource reconnects automatically, and a slow fallback refresh handles missed events.
- **Safety:** Posts display the visitor's public name, not their UUID token. Server-side session checks protect write operations. These are anonymous browser-bound profiles, not verified identities, and the chat is public.

For deployment, use a long-running Node.js host that supports streaming HTTP connections and PostgreSQL notifications. A serverless deployment that terminates SSE requests or creates transient Node instances cannot be assumed to provide persistent realtime delivery. Consider rate limits at the public ingress as traffic grows.

## Verification

With Docker/PostgreSQL and the Next.js dev server running:

```sh
npm run lint
npm run build
npm run test:visitors
npm run test:presence
npm run test:community
```

The visitor API integration test creates disposable profiles, checks global numbering, idempotent registration, unauthorized requests, name updates, saved section visits, and achievements, then deletes its test visitors. PostgreSQL sequences remain globally increasing, including after deleted test rows.

The community integration test verifies one feedback per account, the three-edit limit under concurrent requests, server events, public read access, chat validation, chat retention at exactly 20 messages, cooldowns, and social achievements. **Run it only with an empty local development lobby.** The test intentionally publishes and prunes messages; it checks the local database is empty before proceeding and deletes its disposable visitors afterward.

The presence integration test verifies that the public count increases once per active profile, does not double-count repeat heartbeats, notifies listeners, and drops visitor sessions that are older than 60 seconds. It uses disposable profiles without modifying community posts.

If running the Next.js server on a different port, set `TEST_BASE_URL` before `npm run test:visitors`.

## Database schema

The idempotent SQL migrations are `db/001_visitors.sql`, `db/002_feedback_lobby.sql`, and `db/003_presence.sql`. Apply them with `npm run db:migrate`. The application uses `pg` directly, without an ORM. The API routes live in `src/app/api/visitors/`, `src/app/api/feedback/`, `src/app/api/lobby/`, `src/app/api/events/`, and `src/app/api/presence/`.
