# Play Console submission checklist

Tick each line in Play Console in this order. "Ready" means the text or file exists in this repo; "You" means only you can do it.

## 1. Account (You)
- [ ] Play developer account, US$25 one time, identity verified.
- [ ] Developer contact: a public email and phone for the store page (Play shows the email).
- [ ] Organisation or personal account decided. Personal accounts created after Nov 2023 must run a closed test (12+ testers, 14 days) before production. Confirm the current rule in Console.

## 2. Create the app
- [ ] Name `Awaaz: Voice Form Filler`, language English (India), App, Free. (Ready: `LISTING.md`)
- [ ] Declarations: not a game, no ads, no in-app purchases.

## 3. Policy pages (Main store listing and App content)
- [ ] Privacy policy URL: https://www.awaaz.help/privacy (Ready, live)
- [ ] App access: no login needed, nothing to provide.
- [ ] Ads: No.
- [ ] Content rating questionnaire. (Ready: answers in `DATA_SAFETY.md`)
- [ ] Target audience: 18 and over.
- [ ] Data safety form. (Ready: `DATA_SAFETY.md`; you are responsible for the final answers)
- [ ] Government apps declaration: answer that the app is not published by or for a government. Awaaz says on the site and in the listing that it is independent.
- [ ] Financial features: none. Health apps: not a health app (it links to a government telemedicine site; it gives no medical advice).
- [ ] News app: No. Advertising ID: not used (no ad SDK).

## 4. Store listing
- [ ] Short and full description, English and Hindi. (Ready: `LISTING.md`)
- [ ] App icon 512x512. (Ready: `assets/app-icon-512.png`)
- [ ] Feature graphic 1024x500. (Ready: `assets/feature-graphic-1024x500.png`)
- [ ] Phone screenshots, 2 to 8. (Ready: `assets/phone-*.png`, taken from the release build)
- [ ] Optional: 7-inch and 10-inch tablet screenshots. Not made. Skip unless you want tablet placement.
- [ ] Category: Tools. Tags: pick from the list Play offers.
- [ ] Website https://www.awaaz.help and the contact email.

## 5. Release
- [ ] Testing, Internal testing: upload `release/awaaz-1.0.0.aab`, add yourself as tester, install from the Play link on a real phone, test mic, form fill, complaint, photo.
- [ ] Accept Play App Signing (the `.jks` in `mobile/android/keystore/` is only the upload key). Back that file up first.
- [ ] Check the pre-launch report for crashes and accessibility warnings.
- [ ] Closed testing (12+ testers, 14 days if required), then Production.
- [ ] Release notes (en-IN): `First release. Speak instead of typing: fill government forms by voice, ask Saathi which service you need, and file a complaint with a tracking ID.`
- [ ] Countries: India first.

## 6. After release
- [ ] Raise `versionCode` in `mobile/android/app/build.gradle` and `mobile/app.json` for every update.
- [ ] Rebuild with the command in `RELEASE.md`.
- [ ] Replace the "not on the Play Store" sentence on `/install` with the Play link once it is live. (Not done on purpose: the link does not exist yet.)

## Likely review questions and answers
- "Why microphone?" Speech input, only while the user taps the mic. Audio is not stored; the speech service of the device returns text.
- "Is this a WebView wrapper?" The app has native speech recognition and text-to-speech bridged into the pages, a built-in browser that fills forms, and consent screens in native code. Ask the reviewer to try the voice form fill.
- "Government impersonation?" Independent project. No government logo or name in the icon, title or screenshots.

## Known gaps (audit, 21 Nov 2026)
- Not tested on a real phone: microphone, camera, GPS, the extension in real Chrome. The Android emulator ran the release build (home screen, Saathi, complaint page and guides loaded from www.awaaz.help); it has no real voice input.
- Rate limiting is in memory per server instance, so on Vercel it is a soft limit. A shared store or Vercel's firewall rate limit would make it firm.
- No way for users to delete their own complaint. The privacy policy points to a GitHub issue with the tracking ID. A delete link with a secret would be better.
- No LICENSE file in the public repo, so by default all rights are reserved. Pick a licence if you want others to reuse it.
- CI file is at `docs/github-ci.yml`. To switch it on, run `gh auth refresh -s workflow`, then move it to `.github/workflows/ci.yml` and push.
- Apex domain `awaaz.help` needs its GoDaddy A record.
- AI features (AI fill, Saathi "look closer") are off until `ANTHROPIC_API_KEY` is set on Vercel. The site works without them.
- No analytics, so only Search Console will show traffic and queries.
- iOS: PWA only; no App Store app.
