# Redis removal (MongoDB replacements)

## Authentication

- **Access token blacklist** and **active session index**: MongoDB collections `RevokedAccessToken` and `ActiveAccessToken` via `services/tokenRevocationService.js`.
- New access tokens include a **`jti`** claim; older tokens remain valid until expiry unless revoked (hash-based lookup).
- **Refresh tokens**: unchanged (`UserRefreshToken` in MongoDB).

## OTP

- Checkout/signup email OTP: `EmailOtpChallenge` collection via `services/emailOtpService.js` (hashed OTP, TTL, attempt limits, resend cooldown).
- Routes: `POST /sendotp`, `POST /verifyotp` on the user router.
- Removed unused legacy helper `sendEmailVerificationOTP.js` (was broken and not referenced).

## Caching

- Redis response caches removed; controllers read/write MongoDB through existing services.

## Video progress

- LMS watch progress: **Socket.IO** + MongoDB (`LessonProgress`), not Redis or Bull.

## Environment (when deploying API without Redis)

Remove from the **target** environment `.env` (e.g. Render test backend first, then live when ready):

- `REDIS_ENABLED`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

Do not change live/production env until staging (Render test) is verified.

## Bull / Redis queue (removed)

Orphan Bull files (`videoProgressQueue.js`, `videoProgressWorker.js`) and the `bull` npm dependency were removed after verification:

- No in-repo job producers (`queue.add`).
- Render **test** project has a single Web Service (`npm start` / `index.js`) — no background worker.
- LMS video progress remains **Socket.IO** → MongoDB only.

Optional VdoCipher resume sync via the old worker is **not** active without a separate worker process and job enqueue path.

## Local / Render test commands

Mongo integration (Render **test** DB only — never live production DB):

```powershell
cd backend
$env:AUDIT_TEST_MONGO_URI="<Render test MongoDB URI>"
$env:AUDIT_CONFIRM_TEST_DB="1"
node scripts/audit-auth-otp.mjs
```

HTTP smoke (Render **test** API or local `npm run dev`):

```powershell
cd backend
$env:SMOKE_RUN="1"
$env:SMOKE_CONFIRM_TEST_TARGET="1"
$env:SMOKE_API_BASE="https://<render-test-host>/api/v1"
$env:SMOKE_TEST_EMAIL="<test student email>"
$env:SMOKE_TEST_PASSWORD="<password>"
# optional: SMOKE_ADMIN_EMAIL, SMOKE_ADMIN_PASSWORD, SMOKE_COURSE_ID, SMOKE_SUBMISSION_ID, SMOKE_SOCKET=1
node scripts/smoke-api.mjs
```

## Suggested test order

1. Render **testing** backend + test DB (not live site DB).
2. Run `audit-auth-otp.mjs` and `smoke-api.mjs` against test targets.
3. Then plan live backend cutover separately.

## Rollback

Redeploy the previous git tag and restore Redis env vars if rolling back the old stack.
