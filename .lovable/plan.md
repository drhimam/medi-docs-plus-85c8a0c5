# Plan: Create `LESSONS-LEARNED.md`

Create a single new markdown file at the project root: **`LESSONS-LEARNED.md`**.

No code changes. No existing files modified.

## Purpose
A candid retrospective of the eDoctorDesk build from inception to today, capturing what worked, what didn't, and what we'd do differently if starting over — so the next rebuild (guided by `prompt-to-rebuild.md`) avoids the same detours.

## Structure of the file

1. **Overview** — one-paragraph project recap and why this doc exists.
2. **Timeline of major phases** — Auth → Patients → Visits → Appointments → Prescriptions → Knowledge/AI → Sub-users → Patient Intake → Polish. What shipped in each.
3. **What went well**
   - Design system with HSL tokens + shadcn from day one
   - Preset dialog architecture (`PresetDialogLayout` + `SelectedItemsAccordion`) — paid off across ~20 dialogs
   - Lovable Cloud + Edge Functions kept backend cohesive
   - React Query for server state
   - Reusing the Add Patient wizard inside Patient Intake
4. **What we should have planned earlier** (the core section)
   - **Roles & sub-users on day one** — retrofitting `owner_id` scoping and RLS across every table was expensive; should have been baked into the initial schema.
   - **Activity log as a cross-cutting concern** — instrumenting after the fact meant hunting down every mutation site.
   - **Preset dialog abstraction upfront** — first 3–4 history dialogs were hand-rolled and later rewritten.
   - **Autosave + drafts pattern** — added late to Add Patient and Patient Intake; a shared `useAutosaveDraft` hook from the start would have avoided duplication.
   - **Patient intake mirrors Add Patient** — building intake as a separate form first, then porting all preset dialogs into it, was rework. Should have been one shared wizard from the start.
   - **Storage bucket naming** — `documents` vs `visit-documents` mismatch caused bugs; lock naming + signed-URL policy in a schema doc first.
   - **Export/print layer** — PDF/print logic scattered across prescription, SOAP, requisition, patient form; a shared export primitive would help.
   - **AI usage metering & subscription limits** — added after AI features shipped; enforcement points were retrofitted.
   - **Review/approval flows for intake** — initial version put action buttons in the table row; had to be moved into the review dialog. A "detail-view is the action surface" convention would have avoided the redesign.
   - **Edit-before-approve** on intake — should have been part of the intake spec from day one, not a follow-up.
   - **Branding polish (logo, favicon, meta)** — deferred to late; small but visible churn.
5. **Recurring pain points**
   - RLS policy drift when new tables added without matching GRANT + policies
   - `NodeJS.Timeout` typing issues from missing `@types/node` context (fixed with `ReturnType<typeof setTimeout>`)
   - Sticky notes / deprecated widgets living in code after removal from UI
   - Markdown artifacts in prescription output (stripping added later)
6. **Process lessons**
   - Ask clarifying questions before broad features — several UI reworks came from assumed layouts.
   - Batch related dialogs (all allergies, all history) into one design pass instead of one-at-a-time.
   - Write the "prompt to rebuild" earlier — forcing a spec surfaced gaps.
   - Keep memory notes updated as features solidify (autosave, page breaks, growth charts entries proved this out).
7. **Recommendations for the rebuild**
   - Ship the schema with `owner_id`, `sub_users`, `sub_user_permissions`, `activity_log`, and RLS templates in migration #1.
   - Build the preset dialog kit, autosave hook, export primitive, and print layout before feature #1.
   - Treat detail/review dialogs as the canonical action surface; tables get view-only affordances.
   - Bake AI usage metering into a single `useAiUsage` gate used by every AI call site.
   - Lock branding (name, logo, favicon, meta tags, typography) before shipping any screen.
8. **Open follow-ups** (things still worth doing)
   - Diff view for intake edits vs original submission
   - Email notifications on intake approval/rejection
   - Consolidate scattered export code into `src/lib/export/*`

Length target: ~350–500 lines of markdown, scannable with clear H2/H3s and short bullets — not a wall of prose.
