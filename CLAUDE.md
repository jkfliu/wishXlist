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

# Client tests (Vue Test Utils + Jest)
cd client && npm run test:unit

# Client tests with coverage
cd client && npx vue-cli-service test:unit --coverage
```

Server tests use `globalSetup.js` to spin up an in-memory MongoDB, so no local MongoDB needed for tests.

Client `npm install` requires `--legacy-peer-deps` due to peer dependency conflicts.

## Architecture

The repo has two independent packages: `server/` and `client/`.

### Backend (`server/`)

Single-file Express app (`index.js`) with:
- **Two separate Mongoose connections** — `db_connection` for `wishXlist` (wish list data) and `db_secure_conn` for `wishXlist_security` (users/auth). Uses `mongoose.createConnection()` (not `mongoose.connect()`) specifically to support multiple connections. Schemas are exported as raw schemas (not models) so each connection can register its own model.
- **Authentication** — Passport.js local strategy backed by `passport-local-mongoose`. Login returns user data as JSON; the server does not call `req.logIn()`, so there is no server-side session for the current user — auth state lives only in the Vuex store on the client.
- **Config** — all secrets and URIs in `server/.env` (`MONGO_URI`, `MONGO_SECURITY_URI`, `SESSION_SECRET`, `CORS_ORIGINS`, `PORT`).

API routes:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/WishList` | All wish items |
| GET | `/WishList/:user` | Items for one user |
| POST | `/WishList/Create` | Create item |
| POST | `/WishList/Update` | Update item |
| POST | `/WishList/Delete/:_id` | Delete item |
| POST | `/Auth/Login` | Authenticate (returns user or 401) |
| POST | `/Auth/Change_Password` | Change password |

### Frontend (`client/`)

Vue 2 SPA with Vuex and Vue Router.

**Auth flow:** `Login.vue` POSTs to `/Auth/Login`. On success, commits `set_vuex_globalUser` and `set_vuex_isAuthenticated` to the Vuex store. The router guard in `router.js` redirects unauthenticated users away from routes that don't have `meta.allowAnonymous: true`.

**Wish list views:**
- `MyWishList.vue` — fetches the current user's items, hosts `_WishItemForm.vue` (add) and `_WishList.vue` (display/edit/delete). Uses `display_mode: 'self'`.
- `GroupWishLists.vue` — fetches all users' items. Uses `display_mode: 'group'`, which shows a Gift button instead of Edit/Delete.
- `_WishList.vue` — the shared table component. `display_mode` controls which actions are visible.

**API calls:** `vue.config.js` proxies `/Auth` and `/WishList` to `localhost:3000` during dev. However, several components (e.g. `MyWishList.vue`) hardcode `http://localhost:3000/` in fetch calls, bypassing the proxy — this is a known inconsistency.

**Vuex state:** `vuex_globalUser` (username string) and `vuex_isAuthenticated` (bool). State is not persisted — refreshing the page logs the user out.

## Registering users

There is no signup UI. Users must be registered by uncommenting the `securityUserListModel.register(...)` block in `server/index.js`, running the server once, then re-commenting it.
