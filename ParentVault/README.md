# ParentVault

ParentVault is a security-first mobile app for parents to manage child profiles, custody/school/event/medication schedules, AI-assisted imports, medication confirmations, custom notifications, and event journaling.

## Apps

- `apps/mobile` — Expo React Native app for Android and iOS.
- `apps/api` — Node/Fastify backend skeleton designed for cloud-first deployment and later self-hosting.
- `packages/shared` — shared TypeScript domain models.

## MVP included

- Schedule-only mode: parents can use reminders without entering optional child profile, medical, insurance, school, custody, journal, media, AI, or web-enrichment data.
- Detailed child vault: legal/preferred name, birthdate, SSN last-four/encrypted SSN, allergies, conditions, medications, emergency contacts, doctors, dentists, pharmacies, insurance provider, pharmacy/refill details, school, and custody/legal notes.
- Bot completeness assistant: notices missing details parents may not think to add, but every prompt is skippable and respects privacy/feature settings.
- Security/2FA scaffold: required second factor design, local vault unlock settings, demo 2FA API challenge flow, and step-up verification policy.
- Encryption policy and code boundary: sensitive child data must never be persisted in plaintext; encrypted-value models and secure-storage guardrails are included.
- School enrichment workflow: search/draft school address, phone, hours, website, calendar URL, and out-of-school dates, then require parent confirmation before saving.
- Schedule items: custody, school, event, medication, appointment.
- Natural-language chat commands for schedule/profile adjustments plus RAG-style factual Q&A from the vault.
- AI import placeholders for calendars, decrees, flyers, screenshots, and images.
- Nanny-style notifications without Discord: day-before, day-of, hour-before, pickup timing, therapy planning/hour-before, medication due, nightly journal prompt, and monthly calendar prep.
- Medication reminders with mark-as-taken.
- Evidence-grade journal scaffold: event date/time, entered-at metadata, type/category, notes, people/location, photos, screenshots, camera capture, attachment metadata, and export manifest preview.
- Medical logging through the journal for symptoms, medication events, appointments, doctor calls, and photos.
- Local notification preference model: day before, day of, hour before, custom minutes.
- Backend adapter boundary so cloud and self-host modes can share the same app surface.

## Start mobile app

If you are new to the project, start here first:

- `docs/BEGINNER_START_HERE.md` — plain-English guide to run, read, and safely edit the project.
- `docs/DEVELOPER_WORKFLOW.md` — safe edit/check/commit workflow.
- `docs/TROUBLESHOOTING.md` — common problems and how to fix them.
- `docs/CODE_ORGANIZATION.md` — where each tab/page and helper file lives.

Quick run command:

```bash
npm install
npm run mobile
```

Then press `a` for Android emulator/device or `i` for iOS simulator on macOS.

## Security posture

ParentVault handles extremely sensitive child data including SSNs and medical details. The production path should include:

- End-to-end encryption or per-user envelope encryption before cloud persistence.
- Device biometrics/PIN gate.
- Strict audit logs.
- Zero plaintext SSN logging.
- Image/OCR processing with explicit consent and deletion controls.
- Data export/delete flows.
- Self-host pairing using local-network discovery or relay with user-owned keys.

## Presentation and review artifacts

Generated review assets are checked in under `exports/`:

- `exports/page-pdfs-20260517-0923/` — individual PDFs for Profiles, Schedule, Chat, Import, Journal, and Settings.
- `exports/presentation-20260517-0935/ParentVault-product-presentation.pptx` — 22-slide product walkthrough deck.
- `exports/presentation-20260517-0935/ParentVault-product-presentation.pdf` — PDF version of the same deck.

For a text version of the full presentation narrative, see `docs/PRODUCT_PRESENTATION.md`.

## Product/business docs

- `docs/BEGINNER_START_HERE.md` — beginner-friendly guide for running, reading, and safely editing ParentVault.
- `docs/DEVELOPER_WORKFLOW.md` — safe development workflow, checks, comments, commits, and platform rules.
- `docs/TROUBLESHOOTING.md` — common errors and step-by-step fixes.
- `docs/CODE_ORGANIZATION.md` — map of app tabs, screen files, helpers, and split-file standards.
- `docs/PRODUCT_PRESENTATION.md` — full app/page presentation notes covering each tab, product flow, data model, AI boundaries, security/privacy, build status, and next build priorities.
- `docs/PRODUCT_OVERVIEW.md` — product pillars and docs map.
- `docs/MVP_SCOPE.md` — launchable MVP scope and explicit exclusions.
- `docs/ROADMAP.md` — cloud-first path through public launch and later self-host.
- `docs/USER_STORIES.md` — parent, support, and operator stories.
- `docs/BUSINESS.md` — positioning, pricing, risks, and validation metrics.
- `docs/LAUNCH_CHECKLIST.md` — readiness checklist for Android/iOS cloud launch.
- `docs/ARCHITECTURE.md` — technical architecture and security posture.
- `docs/API.md` — Fastify API skeleton, endpoints, and backend-mode notes.
- `docs/MOBILE_MVP_UX_AUDIT.md` — current mobile MVP UX audit.
- `docs/RAG_ASSISTANT.md` — grounded chatbot/RAG design for answering from child vault data.
- `docs/CHILD_VAULT_SCHEMA.md` — detailed child profile/care-provider schema.
- `docs/BOT_COMPLETENESS.md` — chatbot-driven missing-detail prompts and completeness checklist.
- `docs/AUTH_2FA.md` — account security, two-factor, local unlock, and step-up verification plan.
- `docs/ENCRYPTION.md` — no-plaintext storage policy, encrypted field model, and production key-management requirements.
- `docs/PRIVACY_MODES.md` — schedule-only mode, optional data categories, and consent-first product rules.
- `docs/JOURNAL_EVIDENCE.md` — court/medical journal logging, attachment metadata, and export package design.
- `docs/NANNY_NOTIFICATIONS.md` — Nanny bot notification behavior mapped into mobile local reminders.
- `docs/SCHOOL_ENRICHMENT.md` — school web-search/calendar enrichment workflow.

See `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/ENCRYPTION.md`, `docs/RAG_ASSISTANT.md`, `docs/MOBILE_MVP_UX_AUDIT.md`, and `SECURITY.md` before using real family data.
