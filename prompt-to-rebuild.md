# Prompt to Rebuild — eDoctorDesk

Build a full-stack medical practice management web application called **eDoctorDesk** (branding: eDoctorDesk.com). It is a HIPAA-minded, single-clinician + team platform for managing patients, visits, appointments, clinical documentation, prescriptions, a personal medical knowledge base, and AI-assisted clinical tooling.

---

## 1. Tech Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5, React Router v6, TailwindCSS v3, shadcn/ui, lucide-react icons, sonner + shadcn `toast` for notifications, `@tanstack/react-query`, `react-markdown`, `date-fns`.
- **Backend (Lovable Cloud / Supabase):** Postgres with Row Level Security, Auth (email/password + Google OAuth), Storage buckets, Edge Functions (Deno).
- **AI:** Lovable AI Gateway (Gemini / GPT models) for text generation, transcription (voice-to-text), translation, and RAG chat.
- **Design tokens:** All colors, gradients, shadows in `src/index.css` via HSL CSS variables; shadcn theming; never hardcode `text-white`/`bg-black`/hex in components. Support dark mode. Distinctive brand: **medical cross with DNA helix inside a rounded square**, animated twist on hover; matching favicon PNG.

---

## 2. Routing

```
/                                 → Landing/Index
/login                            → Login (email/password + Google)
/register                         → Register (with reCAPTCHA-style flow)
/accept-invite                    → Sub-user invitation acceptance
/patient-intake/:token            → Public patient intake form (no auth)
/dashboard                        → DashboardHome (protected)
/dashboard/patients               → Patient list
/dashboard/patients/add           → Add patient wizard
/dashboard/patients/:id           → Patient detail
/dashboard/patients/:id/edit      → Edit patient
/dashboard/patients/:id/add-visit → Add visit
/dashboard/clinical-documentation/:visitId
/dashboard/ai-tools               → AI tools hub
/dashboard/knowledge/*            → Knowledge base
/dashboard/profile
/dashboard/settings               → Includes Sub-user management + activity log
/dashboard/billing                → Subscription
```

Lazy-load dashboard child routes with `React.lazy` + `Suspense`.

---

## 3. Authentication & Authorization

### 3.1 Auth
- Email/password signup with email confirmation disabled by default (configurable).
- Google OAuth (must be pre-configured on the auth provider).
- Password reset flow with server-side rate limiting via edge function `password-reset-with-rate-limit` (tracks attempts in `password_reset_attempts` table).
- Session persisted via localStorage; auth-guarded routes redirect to `/login`.

### 3.2 Sub-Users (Team Members)
- Each **owner** can invite up to **4 sub-users**.
- Roles enum `user_role` = `'owner' | 'sub_user'`.
- `sub_users` table links `owner_user_id` → `sub_user_id` with status (`pending`, `active`, `suspended`).
- Invitation flow: owner enters email + name → edge function `send-sub-user-invite` sends invite with token → sub-user visits `/accept-invite?token=...` → creates account → linked.
- `sub_user_permissions` table stores per-module toggles: `patients`, `appointments`, `ai-tools`, `knowledge`, and per-action flags (`can_create`, `can_edit`, `can_delete`, `can_export`).
- Custom hook `useSubUser()` exposes `isSubUser`, `canAccess(module)`, `canPerformAction(action)`, `getOwnerIdForLogging()`.
- Navigation and buttons hide/disable based on permissions; “Team Member” badge shows in header.
- Sub-users read/write against the **owner's** data (RLS: `owner_id = auth.uid() OR owner_id IN (SELECT owner_user_id FROM sub_users WHERE sub_user_id = auth.uid() AND status='active')`).

### 3.3 Activity Log
- `sub_user_activity_log` table: `owner_id`, `actor_user_id`, `action` (`create|update|delete|export|view`), `entity_type` (patient, visit, appointment, document, prescription, soap, intake), `entity_id`, `entity_label`, `details`, `created_at`.
- Hook `useActivityLog()` with `logActivity(ownerId, action, entityType, entityId, label, details)`.
- Instrumented on: appointment create/edit/delete, patient delete, visit delete, document upload, prescription export, SOAP export (PDF/TXT), intake approval.
- Owner-only viewer at Settings → **Activity Log** with filters (member, action, entity type, date range) and pagination.

### 3.4 Roles table pattern
Roles MUST live in a dedicated table (`user_roles` or `sub_users`), never on the profile. Use `SECURITY DEFINER` function `has_role(_user_id, _role)` for RLS checks. Grant `SELECT` to `authenticated`, `ALL` to `service_role` on every public table.

---

## 4. Database Schema (all in `public`, RLS enabled, explicit GRANTs)

| Table | Purpose |
|---|---|
| `profiles` | first_name, last_name, phone, specialty, clinic_name, clinic_address, license_number, avatar_url, bio |
| `user_settings` | theme, email_notifications, appointment_reminders, reminder_time(hrs), language, date_format, time_format |
| `subscriptions` | plan_type (`free`/`pro`), status, current_period_end, stripe_customer_id |
| `ai_usage` | user_id, feature, count, period_start (monthly reset) |
| `sub_users`, `sub_user_permissions`, `sub_user_activity_log` | Team & audit |
| `patients` | Demographics + rich medical history JSON columns (see §5) |
| `patient_drafts` | Autosave scratch for add-patient wizard |
| `visits` | visit_date, chief_complaint, HPI, ROS, physical_exam, assessment, plan, investigations, soap fields |
| `visit_versions` | version history of visits (JSON snapshot) |
| `documents` | file_name, file_url, file_type, size, patient_id, visit_id, category |
| `appointments` | patient_id, appointment_date, appointment_time, reason, status (`scheduled`/`completed`/`cancelled`) |
| `appointment_settings` | start_time, end_time, slot_duration, working_days (jsonb), break_start/end |
| `todos`, `deadlines`, `sticky_notes` (deprecated - removed from UI) | Dashboard widgets |
| `prescription_settings` | Header/footer, logo, signature, watermark, layout options |
| `prescription_snippets` | Reusable/text templates by category |
| `investigation_templates` | Lab panels grouped by 17 categories |
| `soap_export_settings` | Export formatting (font, header, sections toggle) |
| `knowledge_articles` | title, content, summary, tags[], category, source |
| `chat_conversations`, `chat_messages` | Ask-AI RAG history |
| `patient_intake_submissions` | token, submitted_data (jsonb), status (`pending`/`approved`/`rejected`), owner_id, patient_email, patient_name |
| `password_reset_attempts` | Rate limiting |

Every table: `id uuid PK default gen_random_uuid()`, `created_at`, `updated_at`, `user_id` FK to `auth.users`. Triggers to auto-update `updated_at`.

---

## 5. Patient Management

### 5.1 Patient list (`/dashboard/patients`)
- Search by name / phone / DOB / health card.
- Filter by completion status (`incomplete`/`complete`), gender, age range.
- Sort by name, DOB, last visit.
- Row actions: view, edit, delete (with confirm + activity log).
- Bulk export CSV/PDF.
- "Add Patient" and "Patient Intake" tabs (intake shows pending badge count).

### 5.2 Add Patient Wizard (6 steps, clickable progress)
1. **Demographics** — first/last name, DOB, gender, contact number, email, address, health card, occupation, marital status, emergency contact.
2. **Medical History** — Ongoing conditions, Past conditions, Surgical history, Hospitalizations, Family history, Mental health, Birth history, Developmental history, Childhood illnesses, Accidents/Injuries, Menstrual/Pregnancy, Preventive screening, Vaccinations.
3. **Medications** — Ongoing meds, Supplements.
4. **Allergies** — Drug, Food, Environmental, with **NKDA** checkbox.
5. **Social History** — Smoking, Alcohol, Drugs, Exercise, Diet, Living environment.
6. **Review** — Summary; “Skip to Review” from any step; final Save.

Each history section opens a **Preset Dialog** with:
- Checkbox list of common items + free-text with (+) add button.
- Per-item fields (year, duration, severity, notes).
- Selected items accordion with edit/remove.
- Consistent layout via `PresetDialogLayout` + `SelectedItemsAccordion`.

Presets include: Ongoing Conditions, Past Conditions, Surgical, Hospitalization (reason/year/duration), Family (Father/Mother/Siblings with gender, alive/deceased with age-at-death & cause, chronic conditions with cancer type), Mental Health, Birth (gestational age, birth weight, complications), Developmental, Childhood Illnesses, Accidents (year + details), Menstrual/Pregnancy, Preventive Screening (date + result), Vaccination, Drug Allergy, Food Allergy, Environmental Allergy, Medications, Supplements, Social History.

Extras:
- **Auto-save every 30s** to `patient_drafts`.
- **Progress % indicator** on wizard header.
- **Print** button (uses `PrintablePatientForm`).
- Save-for-later button.

### 5.3 Patient Detail
- Tabs: Overview, Visits, Documents, Appointments, Prescriptions, SOAP notes.
- Growth charts (WHO/CDC) via `growthCharts.ts` for pediatric patients (weight/height/head-circumference by percentile).
- Timeline of visits.
- Quick actions: Add Visit, Add Appointment, Upload Document, Generate Prescription.

### 5.4 Edit Patient
Same wizard, prefilled; edits create activity log entry.

---

## 6. Visits & Clinical Documentation

### 6.1 Add Visit
Fields: visit_date, vitals (BP/HR/RR/Temp/SpO2/Weight/Height/BMI auto-calc), Chief complaint, HPI (via **HPIBuilder**), ROS (via **ROSBuilder**), Physical Examination (via `PhysicalExaminationDialog` — system-by-system checklist), Investigations (via **InvestigationBuilderDialog** — 17 categories: Hematology, Biochemistry, Lipid Profile, Liver Function, Renal Function, Thyroid, Diabetes, Cardiac Markers, Urinalysis, Microbiology, Serology, Coagulation, Hormones, Tumor Markers, Imaging, Cardiology, OB-GYN — with normal ranges), Assessment, Plan, Follow-up.

- **Investigation Requisition** dialog to generate a printable lab request.
- **Document Upload** dialog (drag-drop, multi-file, categorized).
- **Version History** dialog — snapshots stored in `visit_versions`, restore any version.
- Delete visit (confirm + log).

### 6.2 Clinical Documentation (SOAP)
- Generate SOAP note from visit data via edge function `generate-soap` (Lovable AI).
- Assessment generator (`generate-assessment`), Plan generator (`generate-plan`).
- Live preview dialog with editable output.
- Export as **PDF** or **TXT** (logged for sub-users).
- Email SOAP via `send-soap-email` edge function.
- **SOAP Export Settings** — logo, header, footer, sections toggle, font.

---

## 7. Appointments

- Dashboard tab shows today's appointments + upcoming table.
- **Add Appointment Dialog:**
  - Radio: Existing patient (search) vs New patient (mini demographic form → creates patient with `completion_status='incomplete'`).
  - Appointment Scheduler: calendar date picker + dynamically generated time slots from `appointment_settings` (respecting working days, breaks, duration).
  - Prevents duplicates at same slot.
  - Sends confirmation email via `send-appointment-confirmation`.
- **TimeSlotSettings** dialog (gear icon in header).
- Row actions: Cancel / Mark Complete (never hard-delete unless via delete action).
- Patient name is a hyperlink to patient page.
- Reminders: scheduled edge function `send-appointment-reminders` runs daily and emails patients per `user_settings.reminder_time`.
- Export appointments to CSV/PDF.
- All create/edit/delete logged for sub-users.

---

## 8. Prescriptions

- Create prescription from visit or standalone.
- **Snippets Dialog** with **8 preset templates** (Hypertension, Diabetes, Common Cold, Gastritis, UTI, Allergic Rhinitis, Migraine, Lower Back Pain) + user custom snippets with search.
- Insert Template / Copy actions.
- AI generation via `generate-prescription` edge function.
- **Live Preview** dialog with real-time formatting.
- **Preview** dialog for final review.
- **Settings** dialog: clinic header, logo, signature image, watermark, layout.
- Layout rules: patient particulars compact (2–3 fields per line: name/age/date on line 1, contact on line 2, address on line 3); no separate "Prescription" heading; barcode replaces patient ID field; header repeats on every page; markdown symbols stripped from body.
- Export PDF (via `prescriptionExport.ts`), email via `send-prescription-email`.
- Export logged for sub-users.

---

## 9. Knowledge Base

- **Articles List** with search, category filter, tags.
- **Article View** (rendered markdown).
- **Manual Entry** and **Edit Article** using a shadcn Rich Text Editor.
- **AI Generated** — enter topic → `generate-article` edge function creates draft; user can enhance via `enhance-article`.
- **Ask AI (RAG)** — chat interface:
  - Retrieves top 5 articles for context, calls `ask-knowledge-ai` edge function.
  - Persists conversations in `chat_conversations` + `chat_messages`.
  - "New Chat" button, "History" sheet listing past conversations.
  - Markdown rendering of answers.

---

## 10. AI Tools Hub

- **Voice Transcribe** — record or upload audio → `voice-to-text` (Whisper-style via AI Gateway) → editable transcript output dialog.
- **Translate** — text or transcript → `translate-text` → target-language output dialog.
- **SOAP / Assessment / Plan generators** (also inline in visit).
- **Prescription generator**.
- **Article generator/enhancer**.
- All AI usage increments `ai_usage`; enforce Free-plan monthly limits.

---

## 11. Patient Intake (Self-Service)

- Owner clicks "Send Intake Link" → enters patient email → edge function `send-patient-intake-invite` emails a unique tokenized link `/patient-intake/:token`.
- Public form (no auth) mirrors full **Add Patient Wizard** with all preset dialogs.
- **Auto-save every 30s** to `patient_intake_submissions` by token.
- **Progress %** indicator.
- **Save for Later** and **Print** buttons.
- Confirmation warning dialog before final submit.
- On submit → `submit-patient-intake` edge function stores as `status='pending'` and notifies owner.
- **Patient Intake Management** dashboard tab (with **notification badge** for pending count):
  - Table with columns: Name, Email, Submitted At, Status — with **only a View icon** action.
  - Clicking View opens a **full read-only + editable review dialog** displaying the entire submitted form. All action buttons (Edit, Approve → creates patient, Reject, **Print**) live inside the review dialog, not the table.
  - Approving inserts into `patients` and moves submission to `approved`; logged.

---

## 12. Dashboard Home

- Greeting with user name.
- Cards: Today’s appointments count, Total patients, Pending intakes, AI usage this month.
- Tabs: **Today's Appointments**, **To-Do List**, **Deadline Tracker**, **Patient Intake** (with badge).
- (Sticky Notes tab was removed — do not include.)
- To-Do list: add/edit/complete/delete, due dates, priority.
- Deadline tracker: title, date, category, color-coded urgency.

---

## 13. Profile & Settings

- **Profile page:** avatar upload (Storage), personal + clinic info, license, bio.
- **Settings page tabs:** General (theme, language, date/time format), Notifications (email toggles, appointment reminder lead time), **Team Members** (invite/remove sub-users, edit permissions), **Activity Log** (owner only).

---

## 14. Subscription & Billing

- Free vs Pro plans. Free limits enforced on: patients, visits, appointments, knowledge entries, document storage GB, AI text (monthly), AI speech (monthly).
- Usage cards on billing page.
- Upgrade button (stub or Stripe/Paddle integration).
- Block create actions when limit exceeded, with upgrade prompt.

---

## 15. Edge Functions (Deno, Lovable Cloud)

`ask-knowledge-ai`, `enhance-article`, `generate-article`, `generate-assessment`, `generate-plan`, `generate-prescription`, `generate-soap`, `password-reset-with-rate-limit`, `send-appointment-confirmation`, `send-appointment-reminders` (scheduled), `send-patient-intake-invite`, `send-prescription-email`, `send-soap-email`, `send-sub-user-invite`, `submit-patient-intake`, `translate-text`, `voice-to-text`.

All secured with JWT except `submit-patient-intake` and `send-patient-intake-invite` reception endpoints; use service-role writes with careful validation. Email via configured provider (Resend or similar).

---

## 16. Storage Buckets

- `avatars` (public read)
- `documents` (private; signed URLs; RLS to owner + sub-users)
- `prescription-assets` (logos, signatures)
- `intake-attachments` (public write via token, read owner-only)

---

## 17. Branding & Design

- App name **eDoctorDesk** everywhere (never “Lovable App”).
- Logo component `EDoctorDeskLogo`: rounded gradient square with medical cross + DNA double helix; `animate` prop triggers hover-triggered helix twist (CSS keyframes).
- Favicon PNG matching logo.
- `index.html` `<title>`: "eDoctorDesk — Modern Practice Management for Clinicians"; matching `<meta name="description">`, OG/Twitter tags.
- Typography: not default Inter/Poppins — pick distinctive pairing (e.g., Space Grotesk + Inter or DM Serif + Inter).
- Semantic tokens only; light + dark themes.

---

## 18. Non-Functional Requirements

- Fully responsive (mobile hamburger sheet nav, desktop top nav).
- Toast feedback for every mutation.
- Confirm dialogs before destructive actions.
- Loading spinners on all async areas.
- Error boundaries.
- SEO: single H1 per page, alt text on images, semantic HTML, lazy image loading, canonical tags.
- Accessibility: keyboard nav, ARIA labels, focus rings via design tokens.
- All destructive/export actions by sub-users appended to activity log.

---

## 19. Build Order Suggestion

1. Design system + logo + auth.
2. Patients CRUD + wizard + preset dialogs.
3. Visits + SOAP + investigations.
4. Appointments + settings + reminders.
5. Prescriptions + snippets + export.
6. Documents + storage.
7. Knowledge base + Ask AI RAG.
8. AI Tools hub (transcribe, translate, generators).
9. Sub-users + permissions + activity log.
10. Patient intake self-service + management.
11. Subscription + usage limits.
12. Dashboard home widgets + polish.

Build every feature end-to-end (DB + RLS + UI + edge function where relevant) before moving on.
