# Awaaz: fill any form by voice

Civic services: voice-based grievance filling. Public services for people who can't fill a form.

Built for the "India Runs on Voice" hackathon (Civic services track). A person opens a service form, taps Awaaz, and answers each question by speaking in their own language. Awaaz asks aloud, listens, and fills the form on the page. The person checks it and presses Submit.

Live at https://www.awaaz.help (also https://awaaz-civic.vercel.app). Installation options for every device are on `/install`.

```
 page form ──scan──▶ field list ──ask aloud──▶ person speaks ──▶ /api/fill ──▶ validated value ──▶ filled + highlighted
 (any site)         (labels, types,            (browser speech)    rules + AI    (server re-checks)    (React-safe events)
                     options)
```

## Saathi: from a problem to the right service

Say a problem ("meri pension band hai", "gali mein gaddha hai") at `/saathi`. It names the government service that fits, lists what to keep ready, and links to the official site. For complaints it can also hand over to voice-filling.

The catalog in `src/lib/saathi/catalog.ts` is a closed, hand-curated list. The matcher runs on the device first. Only when the rules are unsure is the transcript sent to the AI, and the model can return nothing but catalog ids, so it cannot invent a website. Every link returned HTTP 200 on 2026-11-19. PM-JAY, NSAP, the National Scholarship Portal, the Swachhata app and PMGSY are missing because the build machine could not reach them. Roads and power cuts have no national portal, so they go to the in-app complaint. Each card also has a "Link not opening?" fallback to india.gov.in and igod.gov.in.

## Photo and location proof

- The browser redraws the photo on a canvas, which removes EXIF data including hidden GPS. The server refuses any JPEG that still has EXIF.
- Location is added only when the person taps the button, and it is rounded to about 11 m.
- The photo is write-only. It has no public URL, and the submitter holds a one-time token. The public tracking lookup says only whether a photo or location exists.
- "Let my phone describe the photo" is an opt-in checkbox. A small open model (CLIP, run in the browser with transformers.js) picks from a fixed list of civic problems. It needs no API key and the photo stays on the device. The first use downloads about 90 MB from Hugging Face, and the onnxruntime files are self-hosted in `public/ort`. The text shown comes from a fixed table, not from the model.
- Complaints and photos go to a private Vercel Blob store when `BLOB_READ_WRITE_TOKEN` is set. Otherwise a local JSON file is used, for development only (Vercel's disk is read-only).

## Where it runs

| Surface | How | Status |
|---|---|---|
| Web app (PWA) | Install from Chrome, Edge or Safari (Android, iPhone, Mac, Windows, Linux) | Manifest and icons checked on the live site; install itself not tried on real devices |
| Chrome, Edge, Brave | Extension: `release/awaaz-chrome.zip` (also at `/downloads`), or `extension/dist/chrome` | Built and packed, not yet loaded in a real Chrome |
| Firefox | Extension: `release/awaaz-firefox.zip` | Built, untested. Firefox has no speech recognition API, so typing only. Android needs a signed add-on |
| Any browser, phones | Bookmarklet from `/mobile`, which loads the same overlay | Tested in Chromium at desktop and phone sizes, not on real phones |
| Android app (`mobile/`, Expo) | Built-in browser (WebView), native speech (`expo-speech-recognition`) and native TTS. No per-site permissions | Debug build ran on an Android 17 emulator. The release APK points at the live site and has not been run on a device |
| iPhone and iPad | PWA through Safari, "Add to Home Screen" | A native app needs an Apple developer account, so none is built |
| Demo pages | `/demo-form`, `/grievance` | Tested |

There is no Electron or Tauri desktop shell. Electron has no built-in speech recognition, so a wrapped app would lose the main feature. The installed browser app uses the browser's own recognition.

The assistant UI is one codebase (`overlay/`). The extension and the bookmarklet differ only in how they load it and reach the backend.

## Mobile app (built-in browser)

The user types a service website address inside the app, taps Awaaz, and the same overlay is injected into that page. The page runs in our own WebView, so there is no extension and no per-site permission step. WebViews have no browser speech APIs. The overlay talks to the app through a small JSON bridge (`overlay/bridge-protocol.ts`), and the app does speech-to-text, text-to-speech and the `/api/fill` call natively.

```bash
npm run build:ext                    # regenerates mobile/src/generated (overlay bundle + protocol copy)
cd mobile && npm install
EXPO_PUBLIC_API_BASE=https://your-host npx expo run:android   # needs a dev build (native modules); Expo Go cannot load expo-speech-recognition
```

The default is `http://10.0.2.2:3000` (Android emulator to your PC). Plain HTTP is accepted in dev builds only.

The page is untrusted. The native side acts only while the user has switched Awaaz on with the native button, and it switches off on navigation, when the app goes to the background, and after 10 minutes. It validates every message, allows one listen at a time, and rate-limits fill calls. One known limit: on Android, a hostile iframe in the page could also post bridge messages while Awaaz is on. The "Awaaz is on" banner and the short timeouts limit this.

## Run it

### With Docker (recommended)

```bash
docker compose up --build
```

Open http://localhost:3000. No `.env` file and no API keys are needed: the app starts, and the AI features say the key is not set and use the built-in rules instead. Complaints filed locally are kept in the `awaaz-data` Docker volume. To add keys, copy `.env.example` to `.env` and fill in only what you need; `.env.example` lists every variable.

Voice needs Chrome or Edge. `localhost` counts as a secure origin, so the microphone works there.

### Without Docker

```bash
npm install
cp .env.example .env.local           # optional: set ANTHROPIC_API_KEY for AI mapping (server-side only)
npm run dev                          # http://localhost:3000
```

- Open http://localhost:3000/demo-form, tap "Open Awaaz assistant", allow the microphone and answer the questions. Use Chrome, which has the Web Speech API.
- Extension for development: `AWAAZ_API_BASE=http://localhost:3000 npm run build:ext`, then `chrome://extensions` → Developer mode → Load unpacked → `extension/dist/chrome`. Open a form page and click the toolbar button (click again to close). The extension settings let you point it at another server.
- Packaging: `npm run pack:ext` writes `release/awaaz-chrome.zip` and `release/awaaz-firefox.zip` with the live API address built in (set `AWAAZ_API_BASE` to override). Unzip the Chrome one, open `chrome://extensions` (Edge: `edge://extensions`), turn on Developer mode, choose Load unpacked and pick the folder. Pin the Awaaz icon, open a form, then click it or press `Alt+Shift+A`. The same zip can go to the Chrome Web Store or Edge Add-ons. Firefox needs the other zip signed on addons.mozilla.org. `npm run icons` regenerates the icons.
- Production: deploy the Next app on HTTPS. `npm run build` also rebuilds the overlay and copies the onnxruntime files to `public/ort`.

## How a spoken answer becomes a field value

1. `overlay/scan.ts` reads visible, enabled controls: label (label/for, wrapping label, aria, placeholder), type, select options and radio groups.
2. For each field the assistant speaks the question, then listens (`overlay/voice.ts`).
3. `POST /api/fill` validates the answer for that field's type. It understands Hindi and English spoken digits ("नौ आठ… double nine") for phone and number fields, spoken emails ("dot", "at the rate"), dates ("15 August 1990", or numeric day-first), and option matching (exact, partial, yes/no in Hindi and English). Free text is cleaned and passed through. If the rules fail and an API key exists, Claude maps the answer.
4. "Say everything" mode maps one free-form recording onto all fields with Claude. It needs the API key.
5. `overlay/apply.ts` writes the value with the native setter plus `input` and `change` events, so React, Angular and Vue forms notice it. Undo restores the previous value.

## Voice commands (beyond forms)

Tap Voice commands, choose what Awaaz may do on this site and for how long, then tap Allow and start. After that, speak: "scroll down", "click Track complaint", "go back", "read this page", "नीचे जाओ", or give field values. It stays hands-free until you say "stop".

| Permission (you tick each) | Lets Awaaz | Extra gate |
|---|---|---|
| See and read | scroll, read visible text aloud | none |
| Fill fields | write validated values (undo by voice or button) | never passwords, OTP, Aadhaar, card or bank numbers |
| Press buttons and links here | ordinary controls on this site | none |
| Open other websites | follow links that leave the site | you tap Yes every time |
| Submit, send, delete, log in or out | risky controls | you tap Yes every time |

Whatever is ticked, voice can never make payments, purchases or transfers, enter OTPs or passwords, download files, or follow `tel:`, `mailto:` and `javascript:` links.

Security design (tests in `tests/act-*.test.ts`):

- The action set is closed (`src/lib/act/schema.ts`): click, fill, scroll, back, read, stop, each aimed at an element id from a page snapshot. There are no scripts, no free-form URLs and no "type anywhere".
- The server only proposes. `/api/act` returns a plan. The page re-sanitizes it, recomputes the risk from the live element (label, destination, whether it submits) right before acting, and aborts if the page changed it, also after the confirmation dialog.
- Confirmations need a physical tap. The Yes and Allow buttons ignore script-made clicks (`event.isTrusted`), and speech never confirms, because page audio could say "yes". In a real browser, a scripted click on "Allow and start" does nothing.
- Permissions live in memory only, because page JS can forge localStorage. They are per origin, expire after 5, 10 or 30 minutes (30 at most), and end on close or on navigation to another origin. Nothing is granted by default.
- The server sees only link hosts (never full URLs) and only the elements and fields you allowed. On-device mode sends nothing. Simple commands never leave the device, since Hindi and English rules are built in.
- Page text is untrusted data in the prompt. Model output is sanitized: at most 5 actions, one click, and it comes last. A refused step cancels the rest of the plan, and calls are capped at 20 actions a minute.
- A submit is possible only with the risky permission plus a physical tap each time.

Limits: in the mobile app the native side proxies `/api/act` (bridge message `act`), and the Yes and Allow taps are real touches in the WebView. On an Android 17 (API 37) emulator the overlay injected into the WebView, the consent screen worked, a real touch on "Allow and start" started listening through native speech, and the grants line showed. A spoken command was not tested end to end (the emulator has no voice input), and no physical phone was used. Commands act on the main page only, with no iframes or shadow DOM yet. The voice-to-action loop was verified with scripted voice in tests, not with a real microphone.

## Safety rules (enforced in code and tests)

- Awaaz never fills passwords, OTPs, CAPTCHAs, card data, Aadhaar, PAN, passport, bank or UPI numbers and similar IDs. The check runs again on the server (`src/lib/fill/sensitive.ts`), because a page-supplied descriptor is not authoritative. These fields are highlighted and the person is told to type them.
- Form filling never submits the form. With voice commands, a submit needs the risky permission and a physical tap each time (see above).
- Page labels and the transcript are untrusted. The model prompt says so, select and radio output must be one of the page's own option values, every value is re-validated, and panel text is set with `textContent` only (a test checks a malicious label).
- Only the field descriptions and the spoken answer go to the server. Existing values of other fields are never sent. `/api/fill` stores nothing.
- The extension touches a page only when the person clicks its button (`activeTab`). It has no always-on content script, and the background worker forwards only validated messages to an HTTPS (or localhost) server.
- `/api/fill` has CORS `*` because it is called from third-party pages, but it is stateless, cookie-free, size-capped and rate-limited per IP. The limiter is in memory, and the IP comes from `x-forwarded-for`, which can be spoofed without a trusted proxy.

## Checks

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

165 tests cover voice commands, permissions and policy, the normalizers, sensitive-field rules, server fill logic, form scanning and filling in jsdom, the native host controller, mobile URL and API rules, the full guided session (overlay and server logic with a fake voice), panel UI, extension manifests, API-base rules, the grievance flow, Saathi matching, chat and catalog rules, SEO pages and sitemap, photo and EXIF checks, and the Blob repository with a fake client.

The demo form was also filled end to end in headless Chromium against the production build, at desktop and 390x800 phone sizes, with browser speech APIs replaced by a script. That covered React-controlled inputs, a select, a radio, a checkbox and a date, with Aadhaar left empty.

On the live site, a complaint was submitted, a photo uploaded and the status checked with `hasPhoto` and `hasLocation` true.

## Not verified, known limits

- A physical phone was never used. The release APK was built but not run, and iOS is not bundled at all.
- `react-native-webview` 14.0.1 types omit `ref`. `mobile/App.tsx` uses a narrow cast that was checked against the library source.
- Real microphone input and speech quality were not tested (no mic here). Browser speech recognition varies by browser and language, and it sends audio to the browser vendor.
- The extension was built but never loaded into Chrome or Firefox, so the background-worker proxy is untested in a real extension runtime.
- AI mapping and the Saathi "look closer" step were never run against the live API (no key available). Only the rules path ran end to end. For the AI path, unit tests cover only the validation of model output.
- The on-device photo description was tried on one pothole photo in a desktop browser. It was not tried on a phone.
- The bookmarklet is blocked on sites with a strict Content-Security-Policy, and the extension is the answer there. Running bookmarklets from the Chrome Android address bar or Safari bookmarks is the documented workaround, untested on real phones.
- Only the main page is scanned. Forms inside iframes, shadow DOM, canvas widgets, and multi-step wizards that re-render fields need a re-scan, which is not automatic yet.
- Custom widgets (dropdowns that are not `<select>`, date pickers that are not `<input type=date>`) are not understood.
- `/grievance` stores complaints and forwards them nowhere.

## SEO and Play Store

- SEO: canonical URLs, `sitemap.xml`, `robots.txt`, Open Graph image, JSON-LD, and 17 help guides in English (`/help/...`) and Hindi (`/hi/help/...`) with hreflang. Guides take their links and document lists from the closed Saathi catalog, and use no helpline numbers or timelines. To verify the site in Google Search Console, set `GOOGLE_SITE_VERIFICATION` in Vercel. No search-volume data is bundled; check keywords in Keyword Planner and Search Console.
- Play Store: see `store/play/` (`RELEASE.md`, `LISTING.md`, `DATA_SAFETY.md`, graphics). The signed bundle and the upload key stay out of git. Privacy policy: `/privacy`.
- Saathi chat: `/saathi` is now a chat. It asks at most two short questions (for example which kind of pension) and then shows services from the closed catalog. It is rule-based, with no AI and no network call, so it cannot invent a link or number. Logic: `src/lib/saathi/chat.ts`. Added CPENGRAMS and EPFO to the catalog (both URLs returned HTTP 200 on 2026-11-21).
