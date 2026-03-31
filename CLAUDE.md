# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

Requires Node 18 (via nvm) and MongoDB running locally.

```bash
# Load Node 18
export NVM_DIR="/Users/jasonliu/.nvm" && source "/opt/homebrew/opt/nvm/nvm.sh" && nvm use 18

# Start MongoDB (if not running)
brew services start mongodb-community

# Start backend (port 3000)
cd server && npm start

# Start frontend (port 8080)
cd client && npm run serve
```

## Tests

```bash
# Server tests (Jest + Supertest + mongodb-memory-server)
cd server && npm test

# Run a single server test file
cd server && npx jest tests/wishlist.test.js --runInBand

# Client tests (Vue Test Utils + Jest)
cd client && npm run test:unit

# Run a single client test file
cd client && npx vue-cli-service test:unit tests/unit/_WishList.spec.js

# Client tests with coverage
cd client && npx vue-cli-service test:unit --coverage
```

```bash
# Cypress E2E (must use system Node — NOT nvm Node 18)
cd client && unset ELECTRON_RUN_AS_NODE && npx cypress run
```

Server tests use `globalSetup.js` to spin up an in-memory MongoDB, so no local MongoDB needed for tests.

Client `npm install` requires `--legacy-peer-deps` due to peer dependency conflicts.

## Architecture

The repo has two independent packages: `server/` and `client/`.

### Backend (`server/`)

Single-file Express app (`index.js`) with:
- **One Mongoose connection** — `db_connection` connects to `wishXlist` and hosts three collections: `WishList` (wish items), `UserList` (OAuth users), and `Groups` (user groups). Uses `mongoose.createConnection()` so schemas are exported as raw schema objects and the connection registers its own models — do not use `mongoose.model()` directly.
- **Authentication** — Google OAuth via `passport-google-oauth20`. The OAuth callback redirects to the frontend at `/login?oauth_username=<email>`. Server-side sessions are maintained via `express-session` + `passport.session()`. A test-only route `POST /Auth/Test/FakeLogin` is available when `NODE_ENV=test`.
- **Config** — all secrets and URIs in `server/.env`: `MONGO_URI`, `SESSION_SECRET`, `CORS_ORIGINS`, `PORT`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SERVER_URL`, `FRONTEND_URL`.

API routes:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/WishList` | All wish items |
| GET | `/WishList/:user` | Items for one user |
| POST | `/WishList/Create` | Create item |
| POST | `/WishList/Update` | Update item |
| POST | `/WishList/Delete/:_id` | Delete item |
| GET | `/Auth/OAuth/google` | Initiate Google OAuth flow |
| GET | `/Auth/OAuth/google/callback` | OAuth callback — redirects to frontend |
| GET | `/Auth/Me` | Return session user or 401 |
| POST | `/Auth/Logout` | Destroy session |
| GET | `/Groups` | Groups the authenticated user belongs to |
| POST | `/Groups/Create` | Create group (auto-generates 8-char hex invite code) |
| POST | `/Groups/Join` | Join group by invite code (`$addToSet`, idempotent) |
| POST | `/Groups/Leave` | Leave group by `groupId` (`$pull`) |
| GET | `/Groups/Members?groupId=` | Member list for a group |

### Frontend (`client/`)

Vue 2 SPA with Vuex and Vue Router.

**Auth flow:** `Login.vue` has a "Sign in with Google" link pointing to `/Auth/OAuth/google`. After the OAuth callback, the server redirects to `/login?oauth_username=<email>`. `Login.vue`'s `mounted()` hook reads that query param and commits `set_vuex_globalUser` and `set_vuex_isAuthenticated` to the Vuex store. The router guard in `router.js` redirects unauthenticated users away from routes that don't have `meta.allowAnonymous: true`.

**Wish list views:**
- `MyWishList.vue` — fetches the current user's items, hosts `_WishItemForm.vue` (add) and `_WishList.vue` (display/edit/delete). Uses `display_mode: 'self'`.
- `GroupWishLists.vue` — fetches items filtered by selected group membership. On mount: calls `GET /Groups` → `GET /Groups/Members?groupId=` → `GET /WishList`, then filters to members of the selected group excluding the current user. Shows a group dropdown when the user belongs to more than one group. Uses `display_mode: 'group'`, which shows a Gift button instead of Edit/Delete.
- `_WishList.vue` — the shared table component. `display_mode` controls which actions are visible.
- `Groups.vue` (`/groups`) — group management: create, join by invite code, leave. Invite codes hidden by default with Show/Hide toggle. The "Public" group suppresses the invite code and Leave button.

**API calls:** All components use relative URLs (`/WishList/...`, `/Groups/...`, `/Auth/...`). `vue.config.js` proxies `/Auth`, `/WishList`, and `/Groups` to `localhost:3000` during dev. In production, Express serves the built client and all API calls resolve to the same origin.

**Vuex state:** `vuex_globalUser` (username/email string) and `vuex_isAuthenticated` (bool). State is persisted to `localStorage`, so it survives page refreshes. The store also has a `fetchCurrentUser` action that calls `GET /Auth/Me` to revalidate the session.

## Registering users

There is no signup UI. Users are automatically created in the `UserList` collection the first time they sign in via Google OAuth (using their Google email as `username`).