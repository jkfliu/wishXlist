# TODO

## Auth
- [ ] Consider a Passkey-First Approach: default to passkeys with email OTP as fallback (no passwords)
- [ ] Download user avatars for a more user-friendly view
- [x] Switch Facebook app from Development to Live mode (add privacy policy URL, data deletion URL, verify app domains)
- [x] Download user displayName — shown as a column in wish list table and top nav (fetched from OAuth profile, stored in Vuex)

## Groups
- [ ] Group Admin: ability to add/change Group Admins (currently creator is permanent admin)
- [ ] Group Admin: allow Admin to remove members from Groups
- [ ] Group Admin: group administration — e.g. modify Group Name
- [ ] Data migration: populate admins field for legacy groups created before Group Admin feature (admins: [] currently)
- [x] Create option to share invite link with custom 'Welcome to wishXlist' text — Web Share API with clipboard fallback
- [x] Reconsider whether own wish list items should be visible when viewing Group Wish Lists
- [x] Consider whether Wish List items can be group-specific (i.e. visible only to selected groups)
- [x] Debug delay in displaying Group Wish List — loading spinners added; groups cached in Vuex to eliminate redundant fetches
- [x] Shareable invite link for groups — when a group is created, generate a URL that non-members can open to join directly (e.g. /join?code=XXXX)
- [x] Reconsider whether users should join the Public group by default on account creation — decided NOT to auto-join; users opt in manually

## Security
- [ ] Add CSRF protection to POST endpoints
- [x] Audit for exposed secrets — ensure no credentials, API keys, or passwords are committed to the repo
- [x] Add req.isAuthenticated() guards to all /WishList/* endpoints (currently unprotected — critical)
- [x] Add ownership verification to /WishList/Update and /WishList/Delete (any user can modify any item)
- [x] Move visibleToGroups filtering to the server (currently client-side only — not a security boundary)
- [x] Fix GET /Groups/Members — verify requester is a member of the group before returning member list
- [x] OAuth callback leaks email in URL (?oauth_username=) — replaced with ?oauth_success=1; client calls /Auth/Me to get identity from session

## API & Data Model
- [ ] (Scalability) Add pagination to GET /WishList (full collection scan — will degrade at scale)
- [x] Change POST /WishList/Delete to DELETE method
- [x] Standardise route naming — remove verb-based paths (/WishList/Create → POST /WishList)
- [x] Handle stale visibleToGroups group IDs when a group is deleted — cascade $pull on delete via POST /Groups/Delete
- [x] Add database indexes on user_name, visibleToGroups, group membership fields
- [x] Fix price field from String to Number in WishListItem schema

## Frontend
- [x] Re-validate server session on route change (router re-validates via /Auth/Me every 2 min)
- [x] Cache wish list items (GET /WishList) and group members (GET /Groups/Members?groupId=) in Vuex
- [x] When left menu is minimised, show icons instead of hiding it completely — icons shown, labels hidden; collapse toggle at bottom of sidebar
- [x] When logged out, no icon shown on login page; login icon (fa-user-circle) shown on other pages
- [x] Ability to hide/toggle the left-hand side navigation menu
- [x] Sort Wish List by column headings (e.g. Price)
- [x] Optimise for mobile viewing
- [x] (Scalability) Deduplicate GET /Groups fetches — groups cached in Vuex, fetched once on login/app load

## Tech Debt
- [ ] Consider migrating to React framework when the app scales
