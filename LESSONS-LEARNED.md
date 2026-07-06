# Lessons Learned — eDoctorDesk

A candid retrospective of the eDoctorDesk build from day one through today. The goal isn't to relitigate decisions — it's to make the next rebuild (see `prompt-to-rebuild.md`) faster and cleaner by naming the detours we took and the assumptions that cost us the most.

---

## 1. Overview

eDoctorDesk grew from a single-doctor patient tracker into a full practice-management platform: patients, visits, SOAP notes, prescriptions, appointments, a knowledge base with RAG chat, AI tooling, sub-users with permissions and activity logging, and a public patient-intake flow. Most features shipped incrementally in response to real usage, which was great for validation and painful for architecture. This document captures the trade-offs so we don't pay for them twice.

---

## 2. Timeline of Major Phases

| Phase | Shipped |
|---|---|
| **1. Foundation** | Auth (email + Google), design tokens, shadcn setup, landing page |
| **2. Patients** | List, Add Patient wizard, preset history dialogs, edit, delete |
| **3. Visits & Clinical Docs** | Add Visit, HPI/ROS builders, Physical Exam, 17-category Investigation builder, SOAP generation, version history |
| **4. Appointments** | Scheduler, time-slot settings, confirmation & reminder emails |
| **5. Prescriptions** | Snippets library, live preview, settings dialog, PDF export, email |
| **6. Knowledge & AI** | Articles CRUD, AI generation/enhancement, RAG Ask-AI, AI Tools hub (transcribe, translate) |
| **7. Team & Governance** | Sub-users, per-module permissions, activity log |
| **8. Patient Intake** | Public tokenized form, autosave, progress %, print, warning-before-submit, save-for-later, management dashboard, review dialog with edit/approve/reject/print |
| **9. Polish** | Logo + DNA-helix hover animation, favicon, branding pass, `prompt-to-rebuild.md` |

---

## 3. What Went Well

- **HSL design tokens + shadcn from day one.** Dark mode and theme tweaks stayed cheap. Every place we broke this rule (hard-coded `text-white`, hex colors) later needed a fix.
- **Preset dialog architecture** (`PresetDialogLayout` + `SelectedItemsAccordion` + `usePresetMobilePresentation`). Once it existed, ~20 medical-history dialogs became formulaic.
- **Lovable Cloud + Edge Functions.** One backend surface, one auth model, one deploy path.
- **React Query** for server state kept caching, refetching, and mutation UX consistent.
- **Reusing the Add Patient wizard inside Patient Intake** — after the initial rework, this became the single source of truth for medical-history capture.
- **Memory notes** for tricky features (autosave, page breaks, growth-chart percentiles, prescription export rules) — future edits stayed within the established rules.

---

## 4. What We Should Have Planned Earlier

This is the section that matters most.

### 4.1 Multi-tenant scoping (owner_id + sub-users)
Sub-users landed mid-project. Retrofitting `owner_id` onto every table, rewriting RLS policies, and hunting down places that used `auth.uid()` directly instead of "owner or delegated sub-user" was expensive.
**Rebuild rule:** ship the very first migration with `owner_id`, the `sub_users` table, the `has_permission` security-definer function, and a canonical RLS template. Every new table copies that template.

### 4.2 Activity log as a cross-cutting concern
Added after most mutation code already existed, so we had to grep every create/update/delete/export site and thread `logActivity` calls through them.
**Rebuild rule:** wrap mutations in a thin `useAuditedMutation` helper from day one; entity type + label are required arguments.

### 4.3 Preset dialog abstraction
The first three or four history dialogs were hand-rolled with duplicated markup and inconsistent mobile behavior. All of them were later rewritten on top of `PresetDialogLayout`.
**Rebuild rule:** build the preset kit *first*, then instantiate dialogs. Cheaper by a factor of ~5.

### 4.4 Autosave + drafts pattern
Autosave was bolted onto Add Patient, then onto Patient Intake, with subtly different logic (30s interval vs 3s idle; different storage tables).
**Rebuild rule:** one `useAutosaveDraft({ key, data, storage })` hook. Pick idle-debounce over interval — it saves fewer writes and feels snappier.

### 4.5 Intake and Add Patient should have been one wizard from the start
Intake was built as its own form, and every preset dialog was later ported over. That port was pure rework.
**Rebuild rule:** the wizard is a shared component with two modes: `authenticated` (writes to `patients`) and `public-token` (writes to `patient_intake_submissions`).

### 4.6 Storage bucket naming and access model
`documents` vs `visit-documents` caused real bugs. Public vs signed-URL rules were decided per-feature.
**Rebuild rule:** name buckets and write the access matrix (public read / signed URL / owner-only) before uploading a single file. Sensitive assets always use `createSignedUrl(3600)`.

### 4.7 Export / print layer
PDF and print code lives in `prescriptionExport.ts`, `soapExport.ts`, `requisitionExport.ts`, `PrintablePatientForm.tsx`, and inline `window.print` handlers. Each rediscovered page-break, header-repeat, and markdown-stripping problems.
**Rebuild rule:** one `src/lib/export/` module with shared primitives — header layout, page-break marker handling, HTML-to-plaintext, sanitization, watermark, signature.

### 4.8 AI usage metering and subscription limits
AI features shipped before metering. Enforcement points had to be sprinkled back in.
**Rebuild rule:** every AI call goes through a `useAiUsage(feature)` gate that returns `{ allowed, remaining, increment }`. No direct `supabase.functions.invoke` for AI without it.

### 4.9 "Detail view is the action surface"
Patient Intake originally put Approve / Reject / Delete / Copy Link / Resend buttons in table rows. We later moved all of them into the review dialog and left only a view icon on the row.
**Rebuild rule:** default pattern is *table row = view only, detail/review dialog = all actions*. Apply this to intake, appointments row menus, and any future admin table.

### 4.10 Edit-before-approve on intake
Editing submitted intake data before creating the patient was a follow-up request. It should have been obvious — the whole point of review is to correct.
**Rebuild rule:** any "approve external submission" flow ships with inline edit from day one.

### 4.11 Branding polish deferred
Logo, favicon, page title, meta description, OG tags, and typography pairing were tweaked late. Small but visible churn (and the "Lovable App" default leaked into a few screenshots).
**Rebuild rule:** lock branding (name, logo SVG, favicon PNG, `<title>`, meta, font pair) before shipping any user-facing screen.

---

## 5. Recurring Pain Points

- **RLS policy drift.** New tables landed without matching `GRANT` + policies more than once, producing "permission denied" bugs at runtime. Fixed permanently by treating GRANT + RLS as part of the same migration.
- **`NodeJS.Timeout` typing.** Repeated TS errors from `setTimeout` return type in browser code; fixed by standardizing on `ReturnType<typeof setTimeout>`.
- **Deprecated widgets lingering.** Sticky notes UI was removed but code stayed around. Removals should include the file, not just the route.
- **Markdown artifacts in prescription output.** The LLM emitted `**bold**` and `#` headings that leaked into printed prescriptions. Stripping was added late; should have been in the export pipeline from the first AI-generated document.
- **Confirm dialogs skipped on destructive actions.** Added inconsistently; some deletes still lack them.
- **Toast + `sonner` duplication.** Both are wired up; picking one earlier would have simplified imports.

---

## 6. Process Lessons

- **Ask before assuming layout.** Several UI reworks (intake action buttons, prescription header, patient-particulars layout) came from guessing at a layout instead of asking. Two clarifying questions save a rewrite.
- **Batch related dialogs into one design pass.** Doing "all allergy dialogs" together produced a consistent shape; doing them one-at-a-time did not.
- **Write the rebuild prompt earlier.** The exercise of writing `prompt-to-rebuild.md` surfaced gaps (missing edge functions, undocumented rules) that we could have caught months earlier.
- **Keep memory notes current.** The entries under `mem://features/*` (autosave, page breaks, growth charts, prescription rules) demonstrably prevented regressions. Treat them as first-class deliverables of a feature, not afterthoughts.
- **Suggest fewer follow-ups, ship the obvious ones.** "Add edit before approve" and "add print button" were framed as suggestions but were really requirements. Ship the requirements; suggest the extras.

---

## 7. Recommendations for the Rebuild

1. **Migration #1 defines the world:** `profiles`, `user_roles`, `sub_users`, `sub_user_permissions`, `sub_user_activity_log`, `has_role`, `has_permission`, the canonical RLS + GRANT template, and `updated_at` triggers.
2. **Build the primitives before the features:** preset dialog kit, `useAutosaveDraft`, `useAuditedMutation`, `useAiUsage`, `src/lib/export/*`, printable layout wrapper, confirmation-dialog helper.
3. **Detail views own actions.** Tables are for scanning and opening; actions live in the detail/review dialog.
4. **One wizard, two modes** for patient capture (authenticated and public-token).
5. **Branding is a gate**, not a polish step. Logo, favicon, title, meta, fonts, and the design-token palette are locked before feature #1.
6. **Every AI call is metered.** No exceptions, no direct `functions.invoke` for AI without the usage gate.
7. **Every destructive action is confirmed and logged.** No exceptions.
8. **Storage buckets and access model are declared in a doc**, not discovered per feature.

---

## 8. Open Follow-Ups Worth Doing

- **Diff view** for intake edits vs the original patient submission before approval.
- **Email notifications** to patients when their intake is approved or rejected.
- **Consolidate export code** into `src/lib/export/` with shared page-break, header, sanitization, and HTML-to-plaintext primitives.
- **Confirm-dialog audit** across all delete/cancel actions.
- **Remove dead code** from deprecated widgets (sticky notes remnants, unused hooks).
- **Toast/sonner consolidation** onto a single notification library.

---

*Last updated: 2026-07-05.*
