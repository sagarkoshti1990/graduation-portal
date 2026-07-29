```md
## <!-- SECTION 8 -->

# 📘 SECTION 8 — GLOBAL OFFLINE UX & SYNC ORCHESTRATION

Most offline architecture is already covered in the existing offline wiki/MD files. Please review existing implementation and documents first before adding duplicate logic. Main goal is to align implementation with the current offline-first architecture and fix incomplete/missing behavior across RN, RN Web, and PWA.

1. Centralized Online/Offline Service Layer

All API services must internally handle:

- online/offline detection
- offline storage fallback
- sync checks
- API refresh logic

UI/screens should NEVER directly manage:

- network checks
- offline storage access
- sync logic
- API fallback handling

Expected service flow:

- if offline:

  - return offline data if available
  - if not available:
    show consistent fallback:
    "You are offline and this data is not available offline."

- if online:

  - first check pending offline sync
  - if pending sync exists:

    - continue showing offline/local data
    - recommend sync first

  - if fully synced:

    - call latest APIs
    - update offline storage

All modules must use:

- offlineService
- dataService
- sync manager

2. Participant List Offline Flow ,
3. Participant Details Offline Flow
   Important Clarification:
   Participant List and Participant Details offline behavior are already partially covered through the centralized service/data layer architecture.

Since screens already consume data from service files instead of directly calling APIs, proper implementation of:

- online/offline detection
- offline storage fallback
- sync-aware data handling

inside the service layer will automatically enable offline support across:

- Participant List
- Participant Details
- Projects
- Tasks
- Observations

without requiring separate offline UI logic in every screen.

Current gaps are mainly related to:

- incomplete offline fallback implementation
- inconsistent service-layer behavior
- Web/PWA offline handling
- service worker caching/routing
- platform-specific offline rendering issues

Main focus should be fixing and aligning the existing service-layer implementation with the offline-first architecture already defined in the plan.

4. Offline-First Rendering

Participant List, Participant Details, Projects, Tasks, and Observation screens should automatically support:

- online mode
- offline mode

UI should remain identical.
Only data source should change internally.

Status-based rendering:

- NOT_ONBOARDED → onboarding project
- IN_PROGRESS → IDP project
- COMPLETED → read-only/completed flow

If required offline data/module is missing:

- disable related section
- show:
  "This module is not available offline."

5. Onboarding Validation Before Download

Before offline download for IN_PROGRESS participants:

- validate onboarding project already exists

Check:
onBoardedProjectId

Logic:

- exists → allow download
- missing/null → assign/create onboarding project first

6. Global Sync System

Global sync button should:

- appear on all pages/layouts
- show only when pending offline changes exist

Pending sync includes:

- forms
- files
- tasks
- project updates
- failed sync items

When online:
show:
"You are now online. You have offline data pending to sync."

Sync flow:
FILES → OBSERVATIONS → TASKS → PROJECT

Requirements:

- sync sequentially
- show 0–100% progress
- dynamic progress calculation
- show current sync stage
- block actions/navigation during sync
- support retry/resume

7. Consistent Offline Fallback Handling

Some APIs/modules may not support offline yet.

Expected behavior:

- if offline and data/module unavailable:
  ALWAYS show:
  "You are offline and this data is not available offline."

This must remain consistent across:

- Participant List
- Participant Details
- Projects
- Tasks
- Observations
- Forms
- Future modules

Avoid:

- blank screens
- browser offline pages
- random API errors
- inconsistent messages

8. Existing Plan Verification

Please verify implementation against:

- SECTION 4 — DOWNLOAD ENGINE
- SECTION 5 — OBSERVATION ENGINE
- SECTION 6 — STORAGE ARCHITECTURE
- SECTION 7 — FILE UPLOAD
- SECTION 8 — GLOBAL OFFLINE UX & SYNC ORCHESTRATION

Focus on:

- implementation gaps
- offline rendering
- centralized service-layer behavior
- sync visibility
- fallback consistency
- PWA offline handling
- onboarding dependency validation

Do not duplicate architecture unnecessarily if already covered in the existing plan.
```
