# eDoctorDesk — Future Improvements & Feature Roadmap

A deep review of the current codebase (React 18 + Vite + TS, Lovable Cloud backend, 25 tables, 17 edge functions, ~35k LOC) surfaced the additions, refinements, and hardening work below. Items are grouped by theme and prioritised (P1 = high impact / low effort, P2 = strategic, P3 = nice-to-have).

---

## 1. Clinical Depth

### P1 — Fill obvious gaps
- **Problem List** as a first-class entity (currently only in `patients.ongoing_conditions` JSON). A dedicated `problems` table (active/resolved, ICD-10, onset, linked visits) unlocks longitudinal tracking.
- **Vitals trend charts** on Patient Detail (BP, weight, HbA1c, BMI over time) — data already exists in `visits`.
- **Medication reconciliation** view: current meds, past meds, drug–drug interaction check via AI, refill due dates.
- **Immunisation schedule** with age-appropriate due-date engine (CDC/WHO) instead of a free-form list.
- **Allergy severity + reaction** as structured fields on every allergy entry (mild/moderate/anaphylaxis).

### P2 — New clinical modules
- **Referrals** (outgoing/incoming, specialist directory, status tracking, letter generator).
- **Lab result inbox** — parse uploaded PDFs with AI, auto-attach to patients, flag out-of-range.
- **Care plans / chronic disease protocols** (Diabetes, HTN, Asthma) — templates + follow-up schedule.
- **Task queue per patient** (e.g. "call re: BP", "chase lab") separate from the dashboard Todo list.
- **Encounter templates** — one-click "Diabetes follow-up" pre-fills HPI/ROS/PE/Plan.

### P3
- ICD-10 / SNOMED-CT / RxNorm code pickers.
- CPT/billing codes on visits for claim export.
- Body-diagram annotation tool for physical exam.

---

## 2. Patient Experience

### P1
- **Patient portal login** (separate role) so patients can see their own visits, prescriptions, and upcoming appointments — reuse the intake token infra.
- **SMS reminders** (Twilio) alongside the existing email reminder function.
- **Appointment self-booking link** — public page similar to `/patient-intake/:token`, respecting `appointment_settings`.

### P2
- **Two-way messaging** between clinician and patient (threaded, attachment support).
- **Post-visit summary** auto-emailed to the patient (already have SOAP export).
- **Multi-language intake form** (leverage existing `translate-text` function).

---

## 3. Scheduling & Workflow

### P1
- **Waitlist** when preferred slots are booked; auto-promote on cancellation.
- **Recurring appointments** (weekly PT, monthly follow-up).
- **Colour-coded calendar view** (month/week/day) — Appointments page is currently table-only.
- **No-show tracking** and per-patient no-show rate.

### P2
- **Multi-provider scheduling** — sub-users already exist; give each their own calendar and let owners view combined.
- **Room / resource booking** (procedure room, ultrasound).
- **Google/Outlook calendar sync** (iCal push + OAuth pull).

---

## 4. AI & Automation

### P1
- **`useAiUsage(feature)` gate** applied consistently (rebuild-lessons flagged this) — today limits are enforced only at DB function level, UI shows no proactive block.
- **Streaming responses** for SOAP / Ask-AI so long generations don't block the UI.
- **Prompt library per user** — store favourite AI prompts, share across team.
- **Voice-driven visit note** — record consultation → transcribe → auto-populate HPI/ROS/PE/Assessment/Plan in one pass.

### P2
- **Ambient scribe mode** (continuous mic during visit with pause/resume).
- **Differential diagnosis assistant** given HPI + ROS.
- **Clinical decision support** flags (e.g. QRISK, CHA₂DS₂-VASc, Wells) built into visit form.
- **Vector-search knowledge base** — currently `ask-knowledge-ai` fetches top 5 by text; move to pgvector for real semantic RAG.
- **Auto-summarise long patient histories** for a "one-glance" patient card.

---

## 5. Documents & Interoperability

### P1
- **Consolidated `src/lib/export/`** primitive (LESSONS-LEARNED already called this out) — merge `exportToPdf`, `prescriptionExport`, `soapExport`, `requisitionExport` behind one API with shared header/footer/watermark/page-break/sanitisation.
- **Document OCR** on upload (Tesseract or AI) so PDFs become searchable.
- **Document versioning** (currently overwrites).

### P2
- **FHIR export** (Patient, Encounter, Observation, MedicationStatement) — opens integration with hospitals/labs.
- **HL7 v2 message ingest** for lab feeds.
- **CDA / CCDA** import for patient onboarding from other EMRs.
- **DICOM viewer** stub for imaging uploads.

---

## 6. Team, Roles & Compliance

### P1
- **Granular per-patient sharing** (e.g. locum sees only today's list) on top of the coarse sub-user model.
- **Break-glass access log** — flag any read of a patient outside the sub-user's normal scope.
- **Session timeout + re-auth** for HIPAA (currently long-lived localStorage session).
- **2FA / TOTP** for owner and sub-users.

### P2
- **Consent capture** (audit-logged) for intake, telehealth, photography.
- **Data-retention policies** (auto-archive patients inactive > N years).
- **Signed audit trail** — hash-chain `sub_user_activity_log` rows to make tampering detectable.
- **Role: Front-desk / Nurse / Biller** as presets on top of the existing sub-user permission grid.

### P3
- SOC2 / HIPAA readiness checklist page in Settings.
- Data export (GDPR-style) — one-click ZIP of all data for a patient.

---

## 7. Billing & Business

### P1
- **Superbills** per visit (fee, CPT, ICD, patient responsibility).
- **Payment collection** — enable Stripe (already recommended in tools) for co-pays and subscription upgrade.
- **Insurance details** on patient record (currently absent).

### P2
- **Analytics dashboard** — revenue, visit counts, top diagnoses, no-show rate, AI usage cost.
- **Invoice PDFs** with clinic branding.
- **Statement runs** (batch overdue-balance emails).

---

## 8. Knowledge Base

### P1
- **Public/private toggle** on articles + share-link for peers.
- **Article revisions** (current schema overwrites).
- **Attachments** (PDF guidelines, diagrams).

### P2
- **Team knowledge base** — sub-users contribute; owner curates.
- **Citations panel** in Ask-AI answers with clickable jumps to source article section.
- **Import from PubMed / Wikipedia** helper.

---

## 9. Dashboard & UX

### P1
- **Global search** (⌘K) across patients, visits, articles, appointments.
- **Empty-state illustrations** — most tables today show a bare "No data".
- **Skeleton loaders** replacing spinner blocks on Patients / Visits.
- **Bulk actions** on patient list (tag, export, message).
- **Saved filters** on tables.

### P2
- **Customisable dashboard widgets** (drag/resize) — the deprecated sticky-notes area could return as a widget slot.
- **Command palette** with recent-patient jump.
- **Keyboard shortcut sheet** (`?`).
- **PWA / offline mode** for reading last-viewed patients without connectivity.
- **Mobile app** (Capacitor wrap of the same React code).

---

## 10. Code-Health & Refactors

### P1
- **Split mega-files**: `InvestigationBuilderDialog.tsx` (2019 LOC), `InvestigationRequisitionDialog.tsx` (1720), `PhysicalExaminationDialog.tsx` (1512). Extract per-system panels + a schema-driven registry.
- **`useAutosaveDraft` hook** — currently duplicated in AddPatient + PatientIntake with subtly different debounce logic.
- **Central `useAuditedMutation`** wrapping React Query mutations + activity log so instrumentation can never drift again.
- **Zod schemas** for every form (many use ad-hoc validation).
- **Consolidate toast libs** — both `sonner` and shadcn `toast` are mounted (LESSONS-LEARNED).

### P2
- **Storybook** for preset dialogs and design tokens.
- **Playwright e2e** for the two highest-value flows: Add Patient wizard and Intake → Approve → Patient.
- **Bundle-size budget** (Vite `rollup-plugin-visualizer`); lazy-load `react-markdown`, PDF libs, growth charts.
- **Error boundary + Sentry-style logging** to a `client_errors` table.
- **RLS policy tests** (pgTAP or a Node harness).
- **Rename `documents` bucket references** everywhere to `visit-documents` (memory notes this trap).

### P3
- Extract shared types package.
- Move edge-function shared code into `supabase/functions/_shared/`.

---

## 11. Testing & QA

- Unit tests for `growthCharts.ts`, `prescriptionExport.ts`, RLS helper hooks.
- Contract tests for every edge function (input validation + happy path).
- Visual regression on preset dialogs (Chromatic / Playwright screenshots).
- Seed script that produces a demo owner + 3 sub-users + 20 patients for reproducible dev/testing.

---

## 12. Observability

- Structured logging in edge functions (level, request id, user id).
- Rate-limit dashboard (password reset, AI usage, intake submissions).
- Uptime + edge-function latency page for admins.
- Cost dashboard: AI tokens per feature per user.

---

## 13. Onboarding & Marketing

- **Interactive product tour** (react-joyride) for new owners.
- **Sample-data toggle** in a fresh account so the dashboard isn't empty.
- **Public marketing site polish** — Index.tsx currently thin; add pricing page, features grid, testimonials, blog powered by knowledge base.
- **Referral programme** (sub-user invite already exists; extend to external referrals).
- **Changelog page** driven by markdown files.

---

## Suggested Sequencing

1. **Refactor sprint** (2 weeks): split mega-dialogs, unify export/autosave/audit hooks, consolidate toasts.
2. **Clinical depth sprint**: Problem List, vitals trends, medication reconciliation.
3. **Patient experience sprint**: patient portal (reuse intake), SMS reminders, self-booking.
4. **Compliance & billing sprint**: 2FA, session timeout, superbills, Stripe.
5. **AI sprint**: streaming, ambient scribe, pgvector RAG, decision support.
6. **Interoperability sprint**: FHIR export, HL7 ingest, OCR on documents.

---

_Last updated: 2026-07-11_
