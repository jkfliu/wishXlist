# TODO

## Auth
- [x] Switch Facebook app from Development to Live mode (add privacy policy URL, data deletion URL, verify app domains)
- [ ] Consider a Passkey-First Approach: default to passkeys with email OTP as fallback (no passwords)
- [ ] Download user name / avatars for a more user-friendly view

## Groups
- [x] Reconsider whether own wish list items should be visible when viewing Group Wish Lists
- [x] Consider whether Wish List items can be group-specific (i.e. visible only to selected groups)
- [x] Debug delay in displaying Group Wish List
- [ ] Create option to share invite link with custom 'Welcome to wishXlist' text
- [ ] Do Groups need Admin users who can remove users from Groups
- [x] Shareable invite link for groups — when a group is created, generate a URL that non-members can open to join directly (e.g. /join?code=XXXX)
- [x] Reconsider whether users should join the Public group by default on account creation

## Frontend
- [x] Ability to hide/toggle the left-hand side navigation menu
- [x] Sort Wish List by column headings (e.g. Price)
- [x] Optimise for mobile viewing

## Tech Debt
- [ ] Consider migrating to React framework when the app scales

## Security
- [x] Audit for exposed secrets — ensure no credentials, API keys, or passwords are committed to the repo (check .env is in .gitignore, scan git history)
- [ ] Add req.isAuthenticated() guards to all /WishList/* endpoints (currently unprotected — critical)
- [ ] Add ownership verification to /WishList/Update and /WishList/Delete (any user can modify any item)
- [ ] Move visibleToGroups filtering to the server (currently client-side only — not a security boundary)
- [ ] Fix GET /Groups/Members — verify requester is a member of the group before returning member list
- [ ] OAuth callback leaks email in URL (?oauth_username=) — find a safer handoff mechanism
- [ ] Add CSRF protection to POST endpoints

## API & Data Model
- [ ] Change POST /WishList/Delete to DELETE method
- [ ] Standardise route naming — remove verb-based paths (/WishList/Create → POST /WishList)
- [ ] Fix price field from String to Number in WishListItem schema
- [ ] Handle stale visibleToGroups group IDs when a group is deleted (cascade or cleanup)
- [ ] Add database indexes on user_name, visibleToGroups, group membership fields
- [ ] Add pagination to GET /WishList (full collection scan — will degrade at scale)

## Frontend
- [ ] Re-validate server session on route change (router currently trusts localStorage auth state)
- [ ] Deduplicate GET /WishList fetches across MyWishList and GroupWishLists

