# Zonexa — Source Code (run locally)

Runnable source for the Zonexa industrial & commercial real-estate platform.
Single-file vanilla-JS app, no `npm install`, no build step required to launch.

---

## What's in here

```
zonexa-source/
├── zonexa.html              ← The runnable app (open this in a browser)
├── src/
│   ├── build.py             ← Reassembles parts → zonexa.html
│   └── parts/               ← 12 source files (1 CSS + 11 JS)
│       ├── 01_styles.css        Design system + app shell
│       ├── 02_core.js           Z namespace: db, session, rbac, validate
│       ├── 03_ui.js             UI helpers (toast, modal, nav)
│       ├── 04_auth.js           OTP login, admin login, 2FA, password reset
│       ├── 05_seed.js           Seed data (users, properties, admins)
│       ├── 06_user_m1_3.js      User app modules 1-3
│       ├── 07_user_m4_8.js      User app modules 4-8
│       ├── 08_user_m9_12.js     User app modules 9-12
│       ├── 09_user_m13_17.js    User app modules 13-17
│       ├── 10_admin_m18_28.js   Admin app modules 18-28
│       ├── 11_admin_m29_37.js   Admin app modules 29-37
│       └── 12_bootstrap.js      App entry point
└── tests/
    ├── smoke_test.js       ← In-browser smoke test (37 checks)
    └── run_smoke.py        ← Headless runner (Playwright)
```

---

## Run it (pick one)

### Option 1 — Just open the file (zero setup)

Double-click `zonexa.html`. It opens in your default browser and runs.

### Option 2 — Local web server (recommended for editing)

A static server avoids browser `file://` quirks. Use any one:

```bash
# Python (already on most systems)
python3 -m http.server 5500
#   then open http://127.0.0.1:5500/zonexa.html

# or Node
npx serve .

# or VS Code + Live Server extension
#   right-click zonexa.html → "Open with Live Server"
```

The app boots into a splash screen, then routes to login.

---

## Demo credentials

The seed data (`src/parts/05_seed.js`) pre-populates these accounts.

**User app** (mobile OTP — the OTP appears in an on-screen toast):

| Role | Mobile |
|---|---|
| Buyer | `9820099900` |
| Seller (KYC approved) | `9820099901` |
| Seller (no KYC) | `9820011225` |

**Admin panel** — append `#/admin` to the URL:

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@zonexa.com` | `Admin@1234` (then 2FA OTPs shown on screen) |
| Office Admin (Mumbai) | `mumbai.admin@zonexa.com` | `Admin@1234` |
| Office Admin (Delhi) | `delhi.admin@zonexa.com` | `Admin@1234` |
| Telecaller | `telecaller@zonexa.com` | `Admin@1234` |

---

## Edit the source and rebuild

Edit any file in `src/parts/`, then rebuild:

```bash
python3 src/build.py
```

Refresh the browser. (Python 3 is required only to rebuild — you can run the pre-built `zonexa.html` without it.)

The build script concatenates `src/parts/*` in order (CSS into `<style>`, JS into `<script>`) and writes `zonexa.html` to the project root.

---

## Run the tests (37 checks, headless)

```bash
pip install playwright
python -m playwright install chromium
python3 tests/run_smoke.py
```

Expect `37/37 PASS`. The test logs in as buyer, seller, office admin and super admin; exercises property listing, approval, CRM assignment, CSV export, broadcast notifications, RBAC enforcement, 2FA and the unauthorized-chat-access block.

---

## Architecture (one paragraph)

Single-file app: one HTML file, one `<style>`, one `<script>`. The JS defines a global `Z` namespace (`Z.db`, `Z.session`, `Z.auth`, `Z.rbac`, `Z.router`, `Z.notify`, `Z.validate`, …) used by every module. State persists in `localStorage` under the `zonexa_db` key; `Z.db` is the in-process analogue of a REST backend. The router is hash-based and gates routes by account type. RBAC gates admin mutations by module and city. To re-point the app at a real HTTP backend, replace `Z.db`/`Z.auth`/etc. with `fetch` calls — the UI never needs to change.

---

## Troubleshooting

- **Blank screen / stuck on "Loading…"** → open DevTools (`F12` → Console). Usually a syntax error introduced while editing a part. Re-run `python3 src/build.py` and check the output.
- **Edited a part file but nothing changed** → you must rebuild (`python3 src/build.py`) then refresh. The browser loads `zonexa.html`, not the parts.
- **`file://` quirks** (some browsers block localStorage on file URLs) → use the local server in Option 2 instead.
