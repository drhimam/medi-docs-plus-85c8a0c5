# eDoctorDesk — Complete Project Walkthrough

> A ground-up, minute-detail tour of the entire codebase, its history, its conventions, and the "why" behind every non-obvious decision. Read this end-to-end before you touch anything and you will save yourself a week.

Companion documents:
- `prompt-to-rebuild.md` — one-shot rebuild spec.
- `LESSONS-LEARNED.md` — what we would do differently.
- `FUTURE-IMPROVEMENTS.md` — prioritised roadmap.
- `README.md` — quick start.
- `.lovable/plan.md` — current in-flight plan.

---

## 0. Elevator pitch

eDoctorDesk is a HIPAA-minded practice management web app for a single clinician plus a small team (owner + up to 4 sub-users). It manages patients, visits, SOAP notes, prescriptions, appointments, documents, a personal medical knowledge base with RAG chat, an AI tools hub, and a public tokenised patient-intake flow. Backend is Lovable Cloud (Postgres + RLS + Auth + Storage + Deno Edge Functions). Frontend is React 18 + Vite + TS + shadcn.

Production URLs:
- Preview: `https://id-preview--02f1b813-468f-46f4-b6cc-20b23a851d88.lovable.app`
- Published: `https://aimedipedia.lovable.app`
- Custom domain: `https://edoctordesk.com`

---

## 1. Chronological history (how we got here)

The migration filenames in `supabase/migrations/` give a reliable timeline. Grouping them into phases:

### Phase 1 — Foundation (Nov 14 – Nov 15, 2025)
- `20251114*` initial `profiles`, `user_settings`, auth wiring, HSL design tokens in `src/index.css`, shadcn install, landing page (`src/pages/Index.tsx`), login/register, Google OAuth toggle.
- Rule locked in: **no hardcoded colors** — every color is a semantic HSL variable + shadcn variant.

### Phase 2 — Patients & preset dialogs (Nov 15 – Nov 19)
- `patients` table with rich JSON columns per history section.
- Six-step **Add Patient wizard** (`src/components/patient/wizard/*`).
- The **Preset Dialog kit** (`PresetDialogLayout`, `SelectedItemsAccordion`, `PresetDialog`, `usePresetMobilePresentation`) — this is the single most important primitive in the codebase; roughly 20 medical-history dialogs were built on top of it.
- `patient_drafts` autosave table (30-second timer originally, later moved to 3-second idle debounce — see mem note *patient-intake-draft-autosave*).

### Phase 3 — Visits & clinical docs (Nov 19 – Nov 27)
- `visits`, `visit_versions` tables.
- `HPIBuilder`, `ROSBuilder`, `PhysicalExaminationDialog` (age/gender-conditional tabs — see mem note), `InvestigationBuilderDialog` (17-category lab panel, one of the two biggest files in the repo at ~2000 LOC), `InvestigationRequisitionDialog`, `DocumentUploadDialog`, `VersionHistoryDialog`.
- Growth chart utilities (`src/lib/growthCharts.ts`) for WHO/CDC percentiles.
- `generate-soap`, `generate-assessment`, `generate-plan` edge functions.
- `visit-documents` storage bucket (NOT `documents` — a rename trap; see core memory).

### Phase 4 — Appointments (Nov 27 – Nov 29)
- `appointments`, `appointment_settings`.
- Scheduler, time-slot generator (`AppointmentScheduler`, `TimeSlotSettings`).
- `send-appointment-confirmation` (on create), `send-appointment-reminders` (scheduled daily).
- Rule: appointments are never hard-deleted; cancel → `status='cancelled'`, done → `status='completed'`.

### Phase 5 — Prescriptions (Dec 3 – Dec 9)
- `prescription_settings`, `prescription_snippets`.
- 8 built-in templates (Hypertension, Diabetes, Common Cold, Gastritis, UTI, Allergic Rhinitis, Migraine, Lower Back Pain).
- Live preview, preview, settings dialogs, snippets dialog, email dialog.
- `generate-prescription`, `send-prescription-email` edge functions.
- `prescriptionExport.ts` with custom HTML→plaintext (mem *prescription-export-html-to-plaintext*), page-break markers (mem *prescription-page-break-implementation*), markdown stripping.

### Phase 6 — Knowledge & AI (Dec 12 – Dec 16)
- `knowledge_articles`, `chat_conversations`, `chat_messages`.
- Manual entry + rich-text editor + AI generation (`generate-article`) + enhancement (`enhance-article`).
- **Ask AI (RAG)** — top-5 text retrieval passed as context to `ask-knowledge-ai` (pgvector still on roadmap).
- AI Tools hub: `voice-to-text` (Whisper via AI Gateway), `translate-text`.

### Phase 7 — Team & governance (Dec 16 – Dec 22)
- `sub_users`, `sub_user_permissions`, `sub_user_activity_log`.
- `has_role` / `has_permission` security-definer functions.
- Owner can invite up to 4 sub-users via `send-sub-user-invite` → `/accept-invite?token=…`.
- `useSubUser()` hook — the gatekeeper for every UI action.
- `useActivityLog()` hook — instrumented into every create/update/delete/export site (retrofit was painful, see LESSONS-LEARNED §4.2).

### Phase 8 — Patient intake (Jan 4 – Jan 8, 2026)
- `patient_intake_submissions` table; `send-patient-intake-invite`, `submit-patient-intake` edge functions.
- Public form at `/patient-intake/:token` (unauthenticated) reusing all preset dialogs from the Add Patient wizard.
- **Patient Intake Management** page: table row = view icon only; all actions (edit, approve, reject, print) live inside the review dialog.
- Edit-before-approve and Print in review dialog were added in the current session.

### Phase 9 — Polish & documentation (current)
- Branding pass: `EDoctorDeskLogo` (rounded gradient square + medical cross + DNA helix, hover animation), favicon PNG, `<title>` + meta tags in `index.html`.
- Documentation: `prompt-to-rebuild.md`, `LESSONS-LEARNED.md`, `FUTURE-IMPROVEMENTS.md`, and this file.

---

## 2. Tech stack — exact versions and why

| Layer | Choice | Why |
|---|---|---|
| Runtime | React 18 + Vite 5 + TypeScript 5 | Lovable-native; fast HMR. |
| Routing | react-router-dom v6 | Nested routes for `/dashboard/*`. |
| Styling | Tailwind v3 + shadcn/ui | Semantic HSL tokens; dark mode free. |
| Icons | lucide-react | Consistent stroke weight. |
| Server state | @tanstack/react-query v5 | Caching, refetch, mutation UX. |
| Local state | React hooks only | No Redux — never needed. |
| Notifications | shadcn `toast` + `sonner` (both mounted — consolidate later, see LESSONS §5) | Sonner used for imperative one-liners, shadcn toast for standard mutations. |
| Markdown | react-markdown + rehype-sanitize | For SOAP output and article rendering. |
| Dates | date-fns | Locale-aware. |
| Charts | recharts | Growth charts. |
| PDF | jsPDF + html2canvas | Prescription/SOAP export. |
| Sanitization | DOMPurify | Any `dangerouslySetInnerHTML` in exports. |
| Backend | Lovable Cloud (Postgres, Auth, Storage, Edge Functions on Deno) | One provider, one auth. |
| AI | Lovable AI Gateway (Gemini / GPT) | No API keys, unified billing. |

Do NOT swap for Next/Angular/Vue/Svelte — Lovable only supports the above.

---

## 3. Repository layout

```
src/
  App.tsx                          # QueryClientProvider, Toaster, Sonner, Router
  main.tsx                         # ReactDOM.createRoot
  index.css                        # HSL design tokens (light + dark)
  App.css                          # ~empty (do not put styles here)
  pages/
    Index.tsx  Login.tsx  Register.tsx  AcceptInvite.tsx
    PatientIntake.tsx              # PUBLIC /patient-intake/:token
    NotFound.tsx
    Dashboard.tsx                  # Layout + nested <Routes> for /dashboard/*
    dashboard/
      AddPatient.tsx  EditPatient.tsx  Patients.tsx  PatientDetail.tsx
      AddVisit.tsx    ClinicalDocumentation.tsx
      Appointments.tsx
      AITools.tsx
      KnowledgeBase.tsx
      Profile.tsx  Settings.tsx  Subscription.tsx
      PatientIntakeManagement.tsx
  components/
    EDoctorDeskLogo.tsx  NavLink.tsx  TranscribeButton.tsx  TranslateButton.tsx
    ui/                            # shadcn primitives (do not hand-edit unless upgrading)
    patient/
      preset/                      # PresetDialog, PresetDialogLayout, SelectedItemsAccordion
      wizard/                      # 6 wizard steps + PrintablePatientForm + WizardProgress
      *Dialog.tsx                  # 20 medical-history preset instances
    visit/                         # Builders + Investigation + Requisition + Version history
    appointments/                  # Scheduler + AddAppointmentDialog + settings
    prescription/                  # Preview/LivePreview/Settings/Snippets/Email
    soap/                          # LivePreview/ExportSettings/Email
    knowledge/                     # ArticlesList/View/AI/Ask/Edit/RichText
    dashboard/                     # TodoList, DeadlineTracker, StickyNotes (deprecated)
    settings/                      # SubUserManagement, SubUserActivityLog
    transcribe/  translate/        # Output dialogs for AI Tools
  hooks/
    use-mobile.tsx  use-toast.ts   # shadcn defaults
    useSubUser.ts                  # permission gate — read this first
    useActivityLog.ts              # every mutation should call logActivity
    useSubscription.ts             # plan + usage
    usePresetMobilePresentation.ts # sheet-on-mobile / dialog-on-desktop
  lib/
    utils.ts                       # cn()
    exportToPdf.ts  exportToCsv.ts # generic
    prescriptionExport.ts          # bespoke rules — DO NOT bypass
    soapExport.ts  requisitionExport.ts
    growthCharts.ts                # WHO/CDC LMS tables + percentile math
  integrations/supabase/
    client.ts                      # AUTO-GEN — never edit
    types.ts                       # AUTO-GEN — never edit
supabase/
  config.toml                      # verify_jwt flags per function; add new fns here
  functions/                       # 17 Deno edge functions
  migrations/                      # timestamped SQL — every one includes GRANT + RLS
public/                            # favicon, placeholder, robots.txt
prompt-to-rebuild.md  LESSONS-LEARNED.md  FUTURE-IMPROVEMENTS.md
PROJECT-WALKTHROUGH.md             # this file
```

---

## 4. Routing map

Top-level (in `src/App.tsx`):

```
/                             Index (marketing)
/login                        Login
/register                     Register
/accept-invite                AcceptInvite (?token=...)
/patient-intake/:token        PatientIntake (PUBLIC, no auth)
/dashboard/*                  Dashboard (auth-guarded)
*                             NotFound
```

Nested inside `Dashboard.tsx`:

```
/dashboard                                  DashboardHome (tabs: today, todos, deadlines, intake)
/dashboard/patients                         List
/dashboard/patients/add                     Wizard (mode="authenticated")
/dashboard/patients/:id                     Detail
/dashboard/patients/:id/edit                Edit wizard
/dashboard/patients/:id/add-visit           AddVisit
/dashboard/clinical-documentation/:visitId  SOAP editor
/dashboard/appointments                     Scheduler + list
/dashboard/ai-tools                         AI hub
/dashboard/knowledge/*                      Articles + Ask AI
/dashboard/profile
/dashboard/settings                         General / Notifications / Team / Activity Log
/dashboard/billing                          Subscription
/dashboard/patient-intake                   Management table
```

Dashboard children are lazy-loaded via `React.lazy` + `<Suspense>`.

---

## 5. Auth & authorisation

### 5.1 Auth
- Email/password (email confirmation OFF by default for smoother testing).
- Google OAuth (must be enabled at the provider config; `redirect_uri` = `window.location.origin`).
- Session in `localStorage` (managed by Supabase client — do not edit `src/integrations/supabase/client.ts`).
- Password reset routes through the `password-reset-with-rate-limit` edge function; rate limits by IP and email in `password_reset_attempts` table (see mem *password-reset*).

### 5.2 Roles
- Enum `user_role = 'owner' | 'sub_user'`.
- Roles live in `user_roles` (owners) and `sub_users` (link owner↔sub-user) — **never on `profiles`**. Storing roles on profiles enables privilege escalation.
- Function `public.has_role(_user_id uuid, _role app_role)` is `SECURITY DEFINER` and used inside RLS policies to avoid recursion.

### 5.3 Sub-users
- Max 4 per owner.
- Invite flow: owner enters email + name → `send-sub-user-invite` → token in email → sub-user visits `/accept-invite?token=…` → creates account → row activates.
- `sub_user_permissions` table stores per-module toggles: `patients`, `appointments`, `ai-tools`, `knowledge` and per-action flags `can_create`, `can_edit`, `can_delete`, `can_export`.
- `useSubUser()` exposes:
  - `isSubUser: boolean`
  - `canAccess(module)` — for nav / route visibility
  - `canPerformAction(action)` — for buttons
  - `getOwnerIdForLogging()` — used everywhere logs are written
- Sub-users read/write against the owner's data. Canonical RLS predicate:
  ```sql
  owner_id = auth.uid()
  OR owner_id IN (
    SELECT owner_user_id FROM public.sub_users
    WHERE sub_user_id = auth.uid() AND status = 'active'
  )
  ```

### 5.4 Activity log
- Table `sub_user_activity_log` columns: `owner_id`, `actor_user_id`, `action` (`create|update|delete|export|view`), `entity_type` (`patient|visit|appointment|document|prescription|soap|intake`), `entity_id`, `entity_label`, `details jsonb`, `created_at`.
- `useActivityLog().logActivity(ownerId, action, entityType, entityId, label, details)`.
- Instrumented at: appointment create/edit/delete, patient delete, visit delete, document upload, prescription export, SOAP export (PDF/TXT), intake approval/rejection/edit.
- Owner-only viewer: Settings → Activity Log with filters (member, action, entity type, date range) + pagination.

---

## 6. Database

25 tables in `public`. **Every** table has:
- `id uuid pk default gen_random_uuid()`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()` (with trigger)
- Some form of ownership column (`user_id` or `owner_id`)
- RLS enabled
- Explicit `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated`
- `GRANT ALL ON <table> TO service_role`
- Anon grants only where a public flow needs them (`patient_intake_submissions` writes via edge function with service role — no anon grant).

Table catalogue:

| Table | Notes |
|---|---|
| `profiles` | 1:1 with `auth.users`. `first_name, last_name, phone, specialty, clinic_name, clinic_address, license_number, avatar_url, bio`. |
| `user_settings` | theme, language, date/time format, `reminder_time` (hours). |
| `user_roles` | owner assignment. |
| `subscriptions` | `plan_type ('free'|'pro'), status, current_period_end`. |
| `ai_usage` | `user_id, feature, count, period_start` — monthly reset. |
| `sub_users` | `owner_user_id, sub_user_id, status ('pending'|'active'|'suspended')`. |
| `sub_user_permissions` | per-module toggles per sub-user. |
| `sub_user_activity_log` | audit trail. |
| `patients` | rich JSON columns for each history section. `completion_status ('incomplete'|'complete')`. |
| `patient_drafts` | wizard autosave. |
| `patient_intake_submissions` | public intake — `token, submitted_data jsonb, status ('pending'|'approved'|'rejected'), owner_id, patient_email, patient_name`. |
| `visits` | vitals, HPI, ROS, physical_exam, investigations, assessment, plan, soap fields. |
| `visit_versions` | JSON snapshot on every save. |
| `documents` | metadata for files in `visit-documents` bucket. |
| `appointments` | `status ('scheduled'|'completed'|'cancelled')`. Never hard-deleted from Appointments UI. |
| `appointment_settings` | working days, start/end, slot duration, break. |
| `todos`, `deadlines` | dashboard widgets. |
| `sticky_notes` | **deprecated** — table exists, UI removed. Don't reintroduce. |
| `prescription_settings` | header/footer/logo/signature/watermark/layout. |
| `prescription_snippets` | user templates. |
| `investigation_templates` | 17-category lab panels. |
| `soap_export_settings` | font, header, footer, section toggles. |
| `knowledge_articles` | `title, content, summary, tags[], category, source`. |
| `chat_conversations`, `chat_messages` | Ask-AI history. |
| `password_reset_attempts` | rate limiting. |

Storage buckets:
- `avatars` — public read.
- `visit-documents` — private, signed URLs (`createSignedUrl(3600)`). **The historical name `documents` is a trap** (see core memory).
- `patient-photos` — signed URLs only, never public.
- `prescription-assets` — private, signed URLs for logos/signatures.
- `intake-attachments` — write via edge function (service role), read owner-only.

---

## 7. Design system

- **All colors, gradients, shadows** are HSL CSS variables in `src/index.css` and mapped through shadcn variants in `tailwind.config.ts`.
- Never write `text-white`, `bg-black`, or `bg-[#…]` in components — bypasses dark mode and theming.
- Light and dark themes ship together; test both.
- Brand: rounded gradient square + medical cross + DNA double helix (`EDoctorDeskLogo`); `animate` prop triggers a hover-only helix twist via CSS keyframes.
- Favicon PNG matches logo.
- `index.html` sets a real `<title>` and `<meta name="description">` — never leave the Lovable defaults.

---

## 8. Core primitives you must know

| Primitive | Where | What it does |
|---|---|---|
| `PresetDialogLayout` | `components/patient/preset/` | Standard preset dialog shell — header, body, footer, sticky mobile CTA, sheet on mobile / dialog on desktop. |
| `SelectedItemsAccordion` | same | Renders the list of currently-selected items with edit/remove affordances. |
| `PresetDialog` | same | Thin wrapper that composes the two above. |
| `usePresetMobilePresentation` | `hooks/` | Chooses `Drawer` vs `Dialog` based on viewport. |
| `useSubUser` | `hooks/` | Permission gate — check this before rendering any action. |
| `useActivityLog` | `hooks/` | `logActivity()` — call on every create/update/delete/export. |
| `useSubscription` | `hooks/` | Plan + usage limits. |
| `growthCharts.ts` | `lib/` | LMS-based percentile math for pediatric vitals. |
| `prescriptionExport.ts` | `lib/` | Prescription rules — header-per-page, patient particulars compact, markdown stripped, watermark, signature, page-break markers. |
| `soapExport.ts` | `lib/` | SOAP formatting per `soap_export_settings`. |
| `PrintablePatientForm` | `components/patient/wizard/` | The one true printable representation of a patient. Used by wizard, intake, and review dialog. |

Rules:
- **Table row = view only. Detail/review dialog = all actions.** Applied to Patient Intake table; extend to any future admin table.
- **Confirm before destructive.** Use shadcn `<AlertDialog>` wrapper.
- **Toast on every mutation.** Success + error variants.
- **Autosave = 3-second idle debounce**, never a polling interval (mem *patient-intake-draft-autosave*).

---

## 9. Feature deep-dives

### 9.1 Add Patient Wizard (`pages/dashboard/AddPatient.tsx` + `components/patient/wizard/*`)
Six steps with a clickable progress bar. Each step can jump to Review. Autosave to `patient_drafts` every 3s of inactivity. Print via `PrintablePatientForm`. Save-for-later stashes the draft and returns to Patients list.

Steps and dialogs:
1. **Demographics** — first/last name, DOB, gender, contact, email, address, health card, occupation, marital status, emergency contact.
2. **Medical History** — Ongoing conditions, Past conditions, Surgical, Hospitalizations, Family (per-relative with alive/deceased age & cause, chronic conditions with cancer subtypes), Mental Health, Birth (gestational age, birth weight, complications), Developmental, Childhood Illnesses, Accidents/Injuries, Menstrual/Pregnancy (filtered by gender), Preventive Screening (date + result), Vaccinations.
3. **Medications** — Ongoing meds, Supplements.
4. **Allergies** — Drug, Food, Environmental + **NKDA** checkbox that disables and clears the three lists (mem *patient-intake-rules*).
5. **Social History** — Smoking, Alcohol, Drugs, Exercise, Diet, Living environment.
6. **Review** — every section rendered summary-style with edit links back.

### 9.2 Patient Intake (public flow)
Owner clicks "Send Intake Link" → enters patient email → `send-patient-intake-invite` emails a tokenised URL. Patient opens `/patient-intake/:token`, fills the same wizard (mode `public-token`), form autosaves to `patient_intake_submissions.submitted_data`. On submit → `submit-patient-intake` sets `status='pending'`. Owner sees a badge count on Dashboard Home and on the Patient Intake tab.

Management view (`PatientIntakeManagement.tsx`):
- Table: Name, Email, Submitted At, Status — **only** a view icon action.
- View opens the **Review dialog** with the entire submitted form rendered read-only and toggleable to edit. Actions inside the dialog:
  - **Edit** — inline editing of every submitted field before approval.
  - **Approve** — creates a `patients` row, sets submission `status='approved'`, logs activity.
  - **Reject** — sets `status='rejected'` with a reason field, logs activity.
  - **Print** — prints the submitted form via `PrintablePatientForm` for the doctor's records.

### 9.3 Visits & Clinical Documentation
Vitals with BMI auto-calc. HPI/ROS builders use accordion sections + free-text. Physical Examination shows only the systems relevant for the patient's age/gender (mem *physical-examination-age-gender-conditional-tabs*). Investigation builder covers 17 lab categories with normal-range flagging (`HIGH`/`LOW` — mem *investigation-import-lab-data*). Every save snapshots to `visit_versions`; restore any prior version.

SOAP flow: generate via `generate-soap` edge function → editable live preview → export PDF/TXT (both logged for sub-users) → email via `send-soap-email`. Formatting controlled by `soap_export_settings`.

### 9.4 Appointments
Add via existing patient search or new patient mini-form (creates a patient with `completion_status='incomplete'`). Scheduler generates slots from `appointment_settings`. Duplicate protection. Confirmation email on create; daily reminder edge function runs per `user_settings.reminder_time`. Row actions: Cancel / Mark Complete (never hard delete unless via the explicit delete). All create/edit/delete logged.

### 9.5 Prescriptions
Snippet library (8 built-ins + user snippets). AI generation via `generate-prescription`. Live preview matches export. Rules (mem *prescription-export-settings*):
- Patient particulars compact: name/age/date on line 1, contact on line 2, address on line 3.
- No "Prescription" heading; barcode replaces the patient ID field.
- Header repeats on every page.
- Markdown symbols stripped from AI output.
- Custom logo/signature stored in `prescription-assets`, loaded non-blocking (never fail the export if a signature URL 404s).

### 9.6 Knowledge Base + Ask AI
Articles CRUD (rich-text editor). AI generation and enhancement. Ask AI is a RAG chat: top-5 articles by text search → prompt to `ask-knowledge-ai` → answer with citations → persisted to `chat_conversations` / `chat_messages`. Vector search (pgvector) is on the roadmap.

### 9.7 AI Tools hub
- Voice transcribe (`voice-to-text`) — record or upload → editable transcript output dialog.
- Translate (`translate-text`) — text or transcript → output dialog.
- SOAP / Assessment / Plan generators.
- Prescription generator.
- Article generator/enhancer.

Every AI call increments `ai_usage` and enforces free-tier monthly caps. `useAiUsage(feature)` is the intended gate (roadmapped — see FUTURE-IMPROVEMENTS §4).

### 9.8 Dashboard Home
Greeting + counter cards + tabs: Today's Appointments, To-Do List, Deadline Tracker, Patient Intake (with pending badge). To-do supports drag reorder (mem *todo-drag-and-drop*). Sticky notes were removed — do not re-add.

### 9.9 Settings
Tabs: General (theme, language, date/time format), Notifications (email toggles, reminder lead time), Team Members (invite/edit/remove sub-users + per-module permissions), Activity Log (owner only, filters + pagination).

### 9.10 Subscription
Free/Pro. Free-tier caps enforced on patients, visits, appointments, knowledge entries, storage GB, AI text/speech per month. Upgrade path via Stripe/Paddle (currently stubbed).

---

## 10. Edge functions

Located in `supabase/functions/`, deployed automatically. `verify_jwt` flags in `supabase/config.toml`.

| Function | JWT | Purpose |
|---|---|---|
| `voice-to-text` | ✓ | Whisper via AI Gateway. |
| `translate-text` | ✓ | Text translation. |
| `generate-soap` / `-assessment` / `-plan` / `-prescription` / `-article` / `enhance-article` | ✓ | LLM completions. |
| `ask-knowledge-ai` | ✓ | RAG chat. |
| `send-appointment-confirmation` / `-reminders` | ✓ | Transactional emails. |
| `send-prescription-email` / `send-soap-email` | ✓ | Doc delivery. |
| `send-sub-user-invite` / `send-patient-intake-invite` | ✓ | Onboarding emails. |
| `submit-patient-intake` | ✗ (public) | Accepts tokenised submissions; validates the token; writes with service role. |
| `password-reset-with-rate-limit` | ✗ (public) | Rate limits by IP + email. |

All AI functions default to Lovable AI Gateway (no external key needed). Email uses the configured provider (Resend or similar).

---

## 11. Conventions and rules (compressed)

- **Data integrity:** never delete appointments (status only). New patients from appointments start `incomplete`.
- **Storage:** documents → `visit-documents`; photos → `patient-photos`; sensitive assets → `createSignedUrl(3600)`.
- **Security:** edge functions default `verify_jwt = true`; only public flows opt out.
- **DOMPurify** on any `dangerouslySetInnerHTML` inside exports.
- **Timers:** use `ReturnType<typeof setTimeout>`, not `NodeJS.Timeout` (browser code).
- **Errors:** wrap dashboard tree in error boundaries; toast failures.
- **Confirm dialogs** on every destructive action; log via `useActivityLog`.
- **RLS + GRANT** live in the *same* migration as the `CREATE TABLE`. A migration without a matching GRANT is broken.
- **Never edit** `src/integrations/supabase/client.ts`, `types.ts`, or `.env` (VITE_SUPABASE_URL / _PUBLISHABLE_KEY / _PROJECT_ID) — all auto-generated.
- **Never edit** the `auth`, `storage`, `realtime`, `supabase_functions`, or `vault` schemas.
- **Preview vs published**: preview URL reflects preview branch; published URL reflects last publish.

---

## 12. Known pain points (open follow-ups)

- Two toast libraries mounted (`sonner` + shadcn `toast`) — consolidate.
- Three mega-files >1500 LOC (`InvestigationBuilderDialog`, `InvestigationRequisitionDialog`, `PhysicalExaminationDialog`) — split into schema-driven per-system panels.
- Autosave logic duplicated between `AddPatient` and `PatientIntake` — extract `useAutosaveDraft`.
- Export code split across `prescriptionExport.ts`, `soapExport.ts`, `requisitionExport.ts`, `exportToPdf.ts`, `PrintablePatientForm.tsx` — consolidate into `src/lib/export/`.
- Some deletes lack confirm dialogs — audit.
- Sticky notes table lingers though UI is gone — schedule removal migration.
- RAG uses text search — migrate to pgvector.
- HIPAA hardening pending: 2FA/TOTP, session timeout, hash-chained audit log, break-glass logging.

Full roadmap: `FUTURE-IMPROVEMENTS.md`.

---

## 13. How to work on this codebase (checklist)

1. Read this file + `LESSONS-LEARNED.md`.
2. Skim the memory index (project uses `mem://` notes for tricky features — treat them as first-class rules).
3. Before editing a file, view it fully. Before editing a table, read the latest migration for it.
4. For new tables: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY` in one migration. Roles never on `profiles`.
5. For new mutations: wire `useActivityLog` and confirm dialogs.
6. For new AI calls: route through the intended `useAiUsage(feature)` gate.
7. For new dialogs: reuse the preset kit; don't hand-roll layouts.
8. For destructive actions on appointments: change status, don't delete.
9. For any file upload: pick the right bucket, use signed URLs for sensitive ones.
10. For any new page: add a real `<title>` and `<meta description>` (SEO) and semantic HTML with one `<h1>`.
11. Test light and dark themes. Test mobile drawers and desktop dialogs.
12. Ship the requirements; suggest the extras.

---

*Last updated: 2026-07-11.*
