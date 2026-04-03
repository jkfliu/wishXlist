# TODO

## Auth
- [ ] Switch Facebook app from Development to Live mode (add privacy policy URL, verify app domains)
- [ ] Allow users to register and login using email only (no Google OAuth required)
- [ ] Consider a Passkey-First Approach: default to passkeys with email OTP as fallback (no passwords)

## Groups
- [ ] Reconsider whether own wish list items should be visible when viewing Group Wish Lists
- [ ] Consider whether Wish List items can be group-specific (i.e. visible only to selected groups)
- [x] Shareable invite link for groups — when a group is created, generate a URL that non-members can open to join directly (e.g. /join?code=XXXX)
- [x] Reconsider whether users should join the Public group by default on account creation

## Frontend
- [x] Ability to hide/toggle the left-hand side navigation menu
- [x] Sort Wish List by column headings (e.g. Price)
- [x] Optimise for mobile viewing

## Security
- [ ] Audit for exposed secrets — ensure no credentials, API keys, or passwords are committed to the repo (check .env is in .gitignore, scan git history)

