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

Server tests use `globalSetup.js` to spin up an in-memory MongoDB, so no local MongoDB needed for tests.

Client `npm install` requires `--legacy-peer-deps` due to peer dependency conflicts.

## Architecture

The repo has two independent packages: `server/` and `client/`.

### Backend (`server/`)

Single-file Express app (`index.js`) with:
- **One Mongoose connection** — `db_connection` connects to `wishXlist` and hosts both the `WishList` collection (wish items) and `UserList` collection (OAuth users). Uses `mongoose.createConnection()` so schemas (`wishListItem_schema.js`, `User_schema.js`) are exported as raw schemas and the connection registers its own models.
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

### Frontend (`client/`)

Vue 2 SPA with Vuex and Vue Router.

**Auth flow:** `Login.vue` has a "Sign in with Google" link pointing to `/Auth/OAuth/google`. After the OAuth callback, the server redirects to `/login?oauth_username=<email>`. `Login.vue`'s `mounted()` hook reads that query param and commits `set_vuex_globalUser` and `set_vuex_isAuthenticated` to the Vuex store. The router guard in `router.js` redirects unauthenticated users away from routes that don't have `meta.allowAnonymous: true`.

**Wish list views:**
- `MyWishList.vue` — fetches the current user's items, hosts `_WishItemForm.vue` (add) and `_WishList.vue` (display/edit/delete). Uses `display_mode: 'self'`.
- `GroupWishLists.vue` — fetches all users' items. Uses `display_mode: 'group'`, which shows a Gift button instead of Edit/Delete.
- `_WishList.vue` — the shared table component. `display_mode` controls which actions are visible.

**API calls:** `vue.config.js` proxies `/Auth` and `/WishList` to `localhost:3000` during dev. However, several components (e.g. `MyWishList.vue`) hardcode `http://localhost:3000/` in fetch calls, bypassing the proxy — this is a known inconsistency.

**Vuex state:** `vuex_globalUser` (username/email string) and `vuex_isAuthenticated` (bool). State is persisted to `localStorage`, so it survives page refreshes. The store also has a `fetchCurrentUser` action that calls `GET /Auth/Me` to revalidate the session.

## Registering users

There is no signup UI. Users are automatically created in the `UserList` collection the first time they sign in via Google OAuth (using their Google email as `username`).