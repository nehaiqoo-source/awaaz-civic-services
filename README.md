# Awaaz: fill any form by voice

Civic services track, "India Runs on Voice" hackathon. A person opens any service form, taps Awaaz, and answers each question **by speaking in their own language**. Awaaz asks aloud, listens, and fills the form on the page. The person checks it and presses Submit themselves.

```
 page form ──scan──▶ field list ──ask aloud──▶ person speaks ──▶ /api/fill ──▶ validated value ──▶ filled + highlighted
 (any site)         (labels, types,            (browser speech)    rules + AI    (server re-checks)    (React-safe events)
                     options)
```

## Saathi and proof (new)
- **Saathi** (`/saathi`): say a problem ("meri pension band hai", "gali mein gaddha hai"); it names the right government service, what to keep ready, and the official link, then hands over to voice-filling. The catalog (`src/lib/saathi/catalog.ts`) is a closed, hand-curated list: the matcher runs on the device first, the AI is only asked (transcript only) when the rules are not sure, and the model can only return catalog ids, so it cannot invent a website. Every link was fetched (HTTP 200) on 2026-11-19. PM-JAY, NSAP, National Scholarship Portal, Swachhata app and PMGSY were **left out because they could not be reached from the build machine**. Roads and power cuts have no national portal, so they go to the in-app complaint.
- **Photo + location proof** on complaints: the photo is redrawn on a canvas in the browser (removes EXIF, including hidden GPS) and the server **refuses any JPEG that still has EXIF**. Location is added only when the person taps the button and is rounded to ~11 m. The photo is write-only (no public URL, one-time token held by the submitter) and the public tracking lookup only says whether a photo/location exists. "Let my phone describe the photo" is an opt-in checkbox: a small open model (CLIP, run in the browser with transformers.js) picks from a fixed list of civic problems, so it needs **no API key and the photo never leaves the device** (one-time ~90 MB model download from Hugging Face; the onnxruntime files are self-hosted in `public/ort`). The text it shows comes from a fixed table, not from the model. Saathi cards also carry a "Link not opening?" fallback to the national portal (india.gov.in) and the government directory (igod.gov.in).
- Storage: complaints and photos use a **private Vercel Blob store** when `BLOB_READ_WRITE_TOKEN` is set, otherwise a local JSON file (dev only; Vercel's disk is read-only).

## Where it runs
| Surface | How | Status |
|---|---|---|
| Chrome / Edge / Brave (desktop) | Extension: `release/awaaz-chrome.zip` (or `extension/dist/chrome`). Works in the browser people already use, no built-in browser needed | Built and packed, **not yet loaded in a real Chrome** |
| Firefox (desktop, Android) | Extension: `release/awaaz-firefox.zip` | Built, **untested** (Android needs a signed/published add-on) |
| Phones and any browser | Bookmarklet from `/mobile` (loads the same overlay) | Overlay tested in Chromium (desktop and phone-sized); **real phones untested** |
| **Awaaz mobile app** (`mobile/`, Expo) | Built-in browser (WebView) + native speech (`expo-speech-recognition`) + native TTS; no per-site permissions | Typechecks, bundles with Metro (Android), host logic unit-tested; **never run on a phone or emulator** |
| Standalone demo | `/demo-form`, `/grievance` | Tested |

The assistant UI is one codebase (`overlay/`). The extension and the bookmarklet only differ in how they load it and reach the backend.

## Mobile app (built-in browser)
The user types a service website address inside the app, taps **Awaaz**, and the same overlay is injected into that page. Because the page is in our own WebView, there is no extension or per-site permission step. Browser speech APIs do not exist in WebViews, so the overlay talks to the app through a small JSON bridge (`overlay/bridge-protocol.ts`) and the app does speech-to-text, text-to-speech and the `/api/fill` call natively.
```bash
npm run build:ext                    # regenerates mobile/src/generated (overlay bundle + protocol copy)
cd mobile && npm install
EXPO_PUBLIC_API_BASE=https://your-host npx expo run:android   # needs a dev build (native modules); Expo Go cannot load expo-speech-recognition
```
Defaults to `http://10.0.2.2:3000` (Android emulator to your PC). Plain HTTP for the server is accepted in dev builds only.
Bridge safety: the page is untrusted. The native side acts only while the user has switched Awaaz on with the native button (auto-off on navigation, app background, 10 min), validates every message, allows one listen at a time, and rate-limits fill calls. Known limit: on Android, a hostile iframe in the page could also post bridge messages while Awaaz is on; the native "Awaaz is on" banner and short timeouts limit this.

## Run it
```bash
rm -rf node_modules && npm install   # node_modules in this folder were installed on Linux; reinstall on your machine
cp .env.example .env.local           # optional: set ANTHROPIC_API_KEY for AI mapping (server-side only)
npm run dev                          # http://localhost:3000
```
- Try it: open http://localhost:3000/demo-form, tap "Open Awaaz assistant", allow the microphone, answer the questions. Use Chrome (Web Speech API).
- **Chrome extension:** `npm run build:ext`, then `chrome://extensions` → Developer mode → Load unpacked → `extension/dist/chrome`. Open a form page and click the toolbar button (click again to close). Extension settings let you point it at your server.
- **Desktop extension (Chrome, Edge, Brave):** `npm run pack:ext` writes `release/awaaz-chrome.zip` and `release/awaaz-firefox.zip`. Unzip the Chrome one, open `chrome://extensions` (Edge: `edge://extensions`), turn on Developer mode, Load unpacked, pick the folder. Pin the Awaaz icon, open a form and click it or press `Alt+Shift+A`. The same zip can be uploaded to the Chrome Web Store / Edge Add-ons; Firefox needs the other zip signed on addons.mozilla.org. Icons are regenerated with `npm run icons`.
- **Production:** deploy the Next app on HTTPS, build the extension with `AWAAZ_API_BASE=https://your-host npm run pack:ext`. `npm run build` also rebuilds the overlay.

## How a spoken answer becomes a field value
1. `overlay/scan.ts` reads visible, enabled controls: label (label/for, wrapping label, aria, placeholder), type, select options, radio groups.
2. For each field the assistant speaks the question, then listens (`overlay/voice.ts`).
3. `POST /api/fill` validates the answer for that field's type: Hindi/English spoken digits ("नौ आठ… double nine") for phone/number, spoken emails ("dot", "at the rate"), dates ("15 August 1990", numeric day-first), option matching (exact/partial/yes-no in Hindi and English). Free text is passed through cleaned. If rules fail and an API key exists, Claude maps it.
4. "Say everything" mode: one free-form recording mapped onto all fields by Claude (needs the API key).
5. `overlay/apply.ts` writes the value with the native setter plus `input`/`change` events so React/Angular/Vue forms notice it. Undo restores the previous value.

## Voice commands (beyond forms)
Tap **Voice commands** → choose what Awaaz may do on this site and for how long → **Allow and start**. Then just speak: "scroll down", "click Track complaint", "go back", "read this page", "नीचे जाओ", or give field values. Hands-free until you say "stop".

| Permission (you tick each) | Lets Awaaz | Extra gate |
|---|---|---|
| See and read | scroll, read visible text aloud | none |
| Fill fields | write validated values (undo by voice or button) | never passwords/OTP/Aadhaar/card/bank |
| Press buttons and links here | ordinary controls on this site | none |
| Open other websites | links leaving the site | **you tap Yes every time** |
| Submit, send, delete, log in/out | risky controls | **you tap Yes every time** |

Never possible by voice, whatever is ticked: payments/purchases/transfers, OTP, passwords, downloads, `tel:`/`mailto:`/`javascript:` links.

Security design (tests in `tests/act-*.test.ts`):
- **Closed action set** (`src/lib/act/schema.ts`): click / fill / scroll / back / read / stop, each aimed at an element id from a page snapshot. No scripts, no free-form URLs, no "type anywhere".
- **The server only proposes.** `/api/act` returns a plan; the page re-sanitizes it, re-computes the risk from the *live* element (label, destination, submit-ness) right before acting, and aborts if the page changed it (also after the confirmation dialog).
- **Confirmations are physical.** Yes/Allow buttons ignore script-made clicks (`event.isTrusted`), and speech never confirms (page audio could say "yes"). Verified in a real browser: a scripted click on "Allow and start" does nothing.
- **Permissions live in memory only** (page JS can forge localStorage), are per-origin, expire (5/10/30 min, max 30), and die on close or navigation to another origin. Nothing is granted by default.
- **Data minimisation:** the server sees only link hosts (never full URLs), and only elements/fields you allowed; on-device mode sends nothing. Simple commands never leave the device (built-in Hindi/English rules).
- Prompt-injection: page text is untrusted data in the prompt, model output is sanitized (at most 5 actions, one click, last), a refused step cancels the rest of the plan, 20 actions/minute cap.
- This replaces the old "never submits": a submit is now possible only with the *risky* permission plus a physical tap each time.
- Limits: in the mobile app the native side proxies `/api/act` (bridge message `act`) and the Yes/Allow taps are real touches in the WebView, verified on an Android 17 (API 37) emulator: the overlay injects into the WebView, the consent screen works, a real touch on "Allow and start" starts listening through native speech, and the grants line shows; a spoken command was NOT tested end to end (emulator has no voice input) and no physical phone was used; commands act on the main page (no iframes/shadow DOM yet); the voice → action loop was verified with scripted voice in tests, **not with a real microphone**.

## Safety rules (enforced in code and tests)
- Never fills passwords, OTPs, CAPTCHAs, card data, Aadhaar, PAN, passport, bank/UPI and similar IDs. The check runs **again on the server** (`src/lib/fill/sensitive.ts`), because a page-supplied descriptor is not authoritative. These fields are highlighted and the person is told to type them.
- Never submits the form.
- Page labels and the transcript are untrusted: the model prompt says so, select/radio output must be one of the page's own option values, every value is re-validated, panel text is set with `textContent` only (a test checks a malicious label).
- Only the field descriptions and the spoken answer go to the server. Existing values of other fields are never sent. Nothing is stored by `/api/fill`.
- The extension only touches a page when the person clicks its button (`activeTab`), has no always-on content script, and the background worker only forwards validated messages to an HTTPS (or localhost) server.
- `/api/fill` has CORS `*` (needed from third-party pages) but is stateless, cookie-free, size-capped and rate-limited per IP (in memory; the IP comes from `x-forwarded-for`, which is spoofable without a trusted proxy).

## Checks
```bash
npm test && npm run typecheck && npm run lint && npm run build
```
126 tests (incl. voice commands, permissions and policy): normalizers, sensitive-field rules, server fill logic, form scanning/filling in jsdom, the native host controller and mobile URL/API rules, the full guided session (overlay + server logic with a fake voice), panel UI, extension manifests, API-base rules, plus the earlier grievance flow.
Also verified in headless Chromium against the production build: the demo form is filled end to end (including React-controlled inputs, a select, radio, checkbox, date, Aadhaar left empty) at desktop and 390x800 phone sizes, with browser speech APIs replaced by a script.

## Not verified / known limitations
- **The mobile app has never run on a device or emulator.** Verified only: TypeScript, `expo-doctor` (20/20), and a Metro Android JS bundle. Real native speech, permissions, WebView injection and iOS are untested (iOS not even bundled).
- `react-native-webview` 14.0.1 types omit `ref`; `mobile/App.tsx` uses a narrow cast verified against its source.
- **Real microphone and speech quality** were not tested (no mic here). Browser speech recognition varies by browser and language; it sends audio to the browser vendor.
- The extension was built but **never loaded into Chrome/Firefox**; the background-worker proxy is untested in a real extension runtime.
- **AI mapping was never run against the live API** (no key available). Only the rules path ran end to end; for the AI path, only the validation of model output is covered by unit tests.
- The bookmarklet is blocked on sites with a strict Content-Security-Policy; use the extension there. Running bookmarklets from the Chrome Android address bar and Safari's bookmarks is the documented workaround but is untested on real phones.
- Only the main page is scanned: forms inside iframes, shadow DOM, canvas widgets and multi-step wizards that re-render fields need a re-scan (not automatic yet).
- Custom widgets (fancy dropdowns that are not `<select>`, date pickers that are not `<input type=date>`) are not understood.
- `/grievance` stores complaints in a JSON file and forwards them nowhere.


## Platforms (one tool, every device)

| Platform | How | Voice |
| --- | --- | --- |
| Android | Install the web app from Chrome (PWA), or sideload the native APK (`mobile/`, built with `EXPO_PUBLIC_API_BASE=https://awaaz-civic.vercel.app`) | yes |
| iPhone / iPad | Safari → Add to Home Screen (PWA). A native iOS build needs an Apple developer account, so it is not built | yes (Safari) |
| Mac | Chrome/Edge "Install", or Safari 17 "Add to Dock", plus the extension | yes |
| Windows / Linux | Chrome/Edge "Install", plus the extension | yes |
| Chrome, Edge, Brave | `release/awaaz-chrome.zip` (also at `/downloads`) | yes |
| Firefox | `release/awaaz-firefox.zip` | limited (Firefox has no speech recognition API; typing works) |

There is deliberately no Electron/Tauri desktop shell: Electron has no built-in speech recognition, so a wrapped app would lose the main feature. The installed browser app uses the browser's own recognition. `npm run pack:ext` now bakes in the live API (`AWAAZ_API_BASE` to override, for example `http://localhost:3000` for local work). The `/install` page explains every option to end users.
