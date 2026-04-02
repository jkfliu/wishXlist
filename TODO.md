# TODO

## Auth
- [x] Facebook OAuth
- [ ] Allow users to register and login using email only (no Google OAuth required)
- [ ] Consider a Passkey-First Approach: default to passkeys with email OTP as fallback (no passwords)

## Groups
- [ ] Shareable invite link for groups — when a group is created, generate a URL that non-members can open to join directly (e.g. /join?code=XXXX)
- [ ] Reconsider whether users should join the Public group by default on account creation

## Frontend
- [x] Ability to hide/toggle the left-hand side navigation menu
- [x] Sort Wish List by column headings (e.g. Price)
- [ ] Optimise for mobile viewing

## Security
- [ ] Audit for exposed secrets — ensure no credentials, API keys, or passwords are committed to the repo (check .env is in .gitignore, scan git history)

