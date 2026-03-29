# TODO

## Auth
- [ ] Facebook OAuth ⬅ top priority
- [ ] Allow users to register and login using email only (no Google OAuth required)
- [ ] Consider a Passkey-First Approach: default to passkeys with email OTP as fallback (no passwords)

## Frontend
- [ ] Ability to hide/toggle the left-hand side navigation menu

## Backend / Infrastructure
- [ ] Add `connect-mongo` session store — in-memory sessions reset on restart, required before production deploy
- [ ] Deploy to Railway or Render (persistent server required for sessions)
- [ ] Set `SERVER_URL` and `FRONTEND_URL` env vars correctly on deploy
