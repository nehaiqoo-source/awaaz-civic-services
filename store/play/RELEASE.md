# Play Store release guide

## What is ready
- `release/awaaz-1.0.0.aab`: signed Android App Bundle (package `com.civicservices.awaaz`, versionName 1.0.0, versionCode 1, targetSdk 36), built against `https://www.awaaz.help`.
- Listing text (English + Hindi): `LISTING.md`. Graphics: `assets/`. Data safety and rating answers: `DATA_SAFETY.md`.
- Privacy policy page: https://www.awaaz.help/privacy (required by Play).

## What only you can do
1. Create a Google Play developer account (one-time US$25 fee, identity verification). Personal accounts created after November 2023 must run a **closed test with at least 12 testers for 14 days** before they can apply for production. Check the current rule in Play Console.
2. Create the app in Play Console: name `Awaaz: Voice Form Filler`, default language English (India), App, Free.
3. Under **Test and release → App signing**, accept Play App Signing. The key in `mobile/android/keystore/awaaz-upload.jks` is your **upload key**. Google keeps the real signing key.
4. Upload `release/awaaz-1.0.0.aab` to **Internal testing** first, add yourself as a tester, install from the Play link on a real phone and test the mic, a form fill and a complaint.
5. Fill the store listing from `LISTING.md`, the Data safety form from `DATA_SAFETY.md`, content rating, target audience, and the privacy policy URL. Add a contact email you are happy to make public.
6. Roll out to closed testing, then production.

## Back up the upload key
`mobile/android/keystore/awaaz-upload.jks` and `mobile/android/keystore.properties` (passwords) are **not in git** and exist only on this Mac. Copy both to a safe place (password manager or an encrypted drive). If they are lost, you must ask Google to reset the upload key.

## Rebuild
```bash
cd mobile/android
EXPO_PUBLIC_API_BASE=https://www.awaaz.help NODE_ENV=production ANDROID_HOME=$HOME/Library/Android/sdk \
  ./gradlew bundleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64
# output: app/build/outputs/bundle/release/app-release.aab
```
Raise `versionCode` in `mobile/android/app/build.gradle` (and `app.json`) for every upload.

## Risks to know about
- **Minimum functionality / WebView apps.** Play can reject apps that are only a website in a frame. Awaaz has native speech recognition and text-to-speech and the built-in form-filling browser, which is the case to make in the review notes. It is still a judgement call by Google.
- **Government-impersonation policy.** The listing and app say clearly that Awaaz is independent and not a government service. Keep that wording; do not use government logos or names in the icon or title.
- **Not tested on a real phone.** The bundle was built and its manifest checked, but this session could not run it on a device. Do the internal-test step above before sending it to review.
- Speech recognition on Android depends on Google's speech service being installed.
