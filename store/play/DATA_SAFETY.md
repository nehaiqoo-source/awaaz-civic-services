# Data safety form: suggested answers

Answer from what the app does today. If you change the app, re-check this. You are responsible for the final answers.

**Does the app collect or share required user data types?** Yes (see below).
**Is all user data encrypted in transit?** Yes (HTTPS only; the app refuses plain HTTP in release builds).
**Can users request that data is deleted?** Yes: tracking ID via the public issue page (see privacy policy). No accounts exist.
**Does the app need an account?** No.

| Data type | Collected | Shared | Purpose | Optional |
|---|---|---|---|---|
| Voice or sound recordings | No. Audio is turned into text by the device's speech service; Awaaz receives only text. | No | n/a | n/a |
| Other user-generated content (spoken or typed complaint text, form answers) | Yes (when filing a complaint or using AI fill) | Yes, with a service provider that processes it for the feature (AI matching) | App functionality | Complaint filing is optional; form filling sends text for processing |
| Photos | Yes, only if the user attaches one | No | App functionality | Yes |
| Approximate/precise location | Yes, only if the user taps "Add my location" (rounded to ~11 m) | No | App functionality | Yes |
| Personal identifiers, financial info, contacts, web history | No | No | n/a | n/a |
| App activity / device IDs / crash logs / analytics | No | No | n/a | n/a |

Notes for the form:
- The mic permission is requested at the moment the user taps the mic.
- No advertising SDK, no analytics SDK.
- "Shared" is about transfer to third parties other than service providers acting on your behalf. Hosting (Vercel) and AI processing (Anthropic) are service providers; Play's definition lets you treat them as processing, not sharing. Confirm that reading against the current Play help text before submitting.

# Content rating questionnaire
Utility app. No violence, sexual content, gambling, user-to-user chat or purchases. Users can file free-text complaints that are stored but not shown to other users (only the owner of the tracking ID sees the status). Expect an "Everyone" rating.

# Target audience
18 and over is the safest choice (it is a civic-services tool). Do not tick "appeals to children".

# Permissions to explain if asked
- RECORD_AUDIO: speech input, only while the user taps the mic.
- INTERNET: send the text to the Awaaz server and load pages.
- VIBRATE: system feedback from the speech library.
Removed on purpose: SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE.
