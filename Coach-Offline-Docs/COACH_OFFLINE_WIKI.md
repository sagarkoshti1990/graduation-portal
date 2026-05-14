# Coach App — Offline Feature Wiki

> **Version:** v2 | **Last Updated:** 2026-05-13 | **Branch:** offline-1

---

## Folder Contents

All documentation for the Coach Offline feature lives in this single folder (`Coach-Offline-Docs/`):

| File | Description |
|------|-------------|
| [COACH_OFFLINE_WIKI.md](COACH_OFFLINE_WIKI.md) | This file — full compiled wiki |
| [SECTION 1A — PROGRAM CONTEXT, OFFLINE NEED & CAPABILITY PRE-REQUISITES.md](<SECTION 1A — PROGRAM CONTEXT, OFFLINE NEED & CAPABILITY PRE-REQUISITES.md>) | Program context, offline strategy, design principles, pre-requisites |
| [SECTION 1B — PARTICIPANT LC FLOW.md](<SECTION 1B — PARTICIPANT LC FLOW.md>) | Full participant lifecycle: online → offline → sync phases |
| [SECTION 2 — SCOPE, CAPABILITIES & PRE-REQUISITES.md](<SECTION 2 — SCOPE, CAPABILITIES & PRE-REQUISITES.md>) | In-scope / out-of-scope features, capability matrix, download requirements |
| [SECTION 3 — CAPABILITIES, DOWNLOAD OPTIONS & STATUS-BASED BEHAVIOR.md](<SECTION 3 — CAPABILITIES, DOWNLOAD OPTIONS & STATUS-BASED BEHAVIOR.md>) | downloadConfig, status-based module availability, re-download behavior |
| [SECTION 4 — DOWNLOAD ENGINE.md](<SECTION 4 — DOWNLOAD ENGINE.md>) | Full download pipeline, retry strategy, resume, idempotency rules |
| [SECTION 5 — OBSERVATION ENGINE.md](<SECTION 5 — OBSERVATION ENGINE.md>) | Entity/submission model, web component integration, edit flow, sync |
| [SECTION 6 — STORAGE ARCHITECTURE.md](<SECTION 6 — STORAGE ARCHITECTURE.md>) | Storage layers, full key schema, IndexedDB sync, data lifecycle |
| [SECTION 7 — FILE UPLOAD.md](<SECTION 7 — FILE UPLOAD.md>) | File capture, local storage, bridge integration, sync flow |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Architecture](#3-project-architecture)
4. [Offline Model](#4-offline-model)
5. [Features & Modules](#5-features--modules)
6. [Download Engine](#6-download-engine)
7. [Observation Engine](#7-observation-engine)
8. [File Upload Module](#8-file-upload-module)
9. [Storage Architecture](#9-storage-architecture)
10. [Sync Engine](#10-sync-engine)
11. [Participant Lifecycle Flow](#11-participant-lifecycle-flow)
12. [Capability Matrix](#12-capability-matrix)
13. [State Management & Data Flow](#13-state-management--data-flow)
14. [API Integration](#14-api-integration)
15. [UI/UX Behavior](#15-uiux-behavior)
16. [Failure Handling & Edge Cases](#16-failure-handling--edge-cases)
17. [Known Issues & Risks](#17-known-issues--risks)
18. [Pending Tasks / Future Improvements](#18-pending-tasks--future-improvements)
19. [Critical Rules Reference](#19-critical-rules-reference)
20. [Developer Notes](#20-developer-notes)
21. [Appendix](#21-appendix)

---

## 1. Project Overview

### Purpose

The Coach App is a **field-based operations platform** designed for coaches who work with participants in environments where internet connectivity is unavailable, unstable, or unreliable. The offline feature enables coaches to continue their full workflow without an active internet connection.

### Problem Statement

Without offline capability:
- Field work gets blocked entirely
- Data capture is delayed or permanently lost
- Coach productivity decreases significantly
- Program tracking becomes inconsistent

### Goals

| Goal | Description |
|------|-------------|
| Uninterrupted field operations | Coaches can work with zero connectivity |
| Reliable data capture | No data loss regardless of network state |
| Improved coach efficiency | Reduced dependency on internet |
| Consistent program tracking | Sync when connectivity is restored |

### Key Features

- **Download-first offline model** — data must be downloaded before offline use
- **Selective, controlled download** — user chooses what to download per participant
- **Edit-only offline model** — no entity/submission creation offline; only edits to existing data
- **Manual sync trigger** — coach initiates sync when internet is available
- **Partial download support** — available modules work even if others fail to download
- **Cross-platform storage** — React Native (MMKV + file system) + Web Component (IndexedDB)

### Primary Users

| User | Offline Need |
|------|-------------|
| **Coaches** | Critical — execute full participant lifecycle offline |
| **Coordinators** | Minimal — mostly online users |

---

## 2. Tech Stack

### Frontend

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native |
| Observation Forms | Web Component (embedded in RN WebView) |
| Bridge Communication | `window.postMessage` / Native-Web bridge |

### Storage

| Platform | Technology | Purpose |
|----------|-----------|---------|
| React Native | MMKV / AsyncStorage | JSON data persistence |
| React Native | `react-native-fs` | File storage (images, documents) |
| Web Component | IndexedDB | Temporary form data & blobs |
| Web Component | LocalStorage | Flags & lightweight state |

### Libraries

| Library | Purpose |
|---------|---------|
| `react-native-fs` | Native file system operations |
| MMKV | High-performance key-value storage |
| AsyncStorage | React Native async key-value store (fallback) |
| IndexedDB (Web) | Browser-based structured storage for web component |

### Tools

> **TODO:** Add CI/CD tooling, build tools, and testing frameworks used in this project.

---

## 3. Project Architecture

### High-Level Architecture

```
App.tsx  (Root)
├── GlobalProvider          src/contexts/GlobalContext.tsx
│   └── LanguageProvider    src/contexts/LanguageContext.tsx
│       └── AuthProvider    src/contexts/AuthContext.tsx
│           └── AppNavigator    src/navigation/AppNavigator.tsx  (React Navigation v6)
│                 ├── Auth Screens
│                 │     ├── Login
│                 │     ├── Forgot Password
│                 │     └── Select Language
│                 └── Main App Screens
│                       ├── Participant List
│                       ├── Participant Detail
│                       │     ├── Project Player
│                       │     │     └── ProjectContext    src/project-player/context/ProjectContext.tsx
│                       │     │           ├── useProjectLoader.ts   (API data loading)
│                       │     │           └── useTaskActions.ts     (task execution)
│                       │     └── Observation Screen    src/screens/Observation/Observation.tsx
│                       │           └── WebComponentPlayer    src/components/WebComponent/
│                       │                 └── <questionnaire-player-main>  (Custom Web Element)
│                       │                       ├── Renders form schema + data
│                       │                       ├── Writes edits → IndexedDB  (temporary)
│                       │                       └── postMessage bridge → offlineStorage
│                       └── Admin Screens
│
├── offlineStorage.ts       src/services/offlineStorage.ts   (AsyncStorage CRUD — source of truth)
├── api.ts                  src/services/api.ts              (Axios + retry + token refresh)
└── authenticationService.ts src/services/authenticationService.ts
```

### Architecture Style

The app is a **React Native + React Native Web** hybrid using an **embedded Web Component** pattern for observation forms:

- **React Native shell** (mobile + web via RN Web) handles navigation, participant data, task management, and storage.
- **Three React Context providers** are stacked at the root — `GlobalContext` (UI/loading state), `LanguageContext` (i18n), and `AuthContext` (user session + tokens).
- **Project Player** (`src/project-player/`) is a self-contained sub-module with its own `ProjectContext`, data-loading hooks, and task-action hooks.
- **Observation forms** are rendered by a custom web element (`<questionnaire-player-main>`) loaded from `/web-component/questionnaire-player-webcomponent.js`. On mobile it runs inside `react-native-webview`; on web it mounts as a native DOM custom element.
- **`offlineStorage.ts`** wraps `@react-native-async-storage/async-storage` and is the single persistent store for all offline data (tokens, user, project data, form edits).

### Storage Layer

```
offlineStorage.ts  (AsyncStorage wrapper)
├── Auth tokens + user object
├── Project + task data
├── Form edit state
└── App preferences (language, theme)

IndexedDB  (inside Web Component only — temporary)
├── Live form field data during editing
└── File blobs (base64) pending upload
     └── Flushed to offlineStorage via postMessage bridge
```

> **Key Principle:** IndexedDB is scoped to the Web Component and is temporary. `offlineStorage` (AsyncStorage) is the authoritative persistent store.

### Platform Bridge (Web Component ↔ Native)

| Direction | Mechanism | Events |
|-----------|-----------|--------|
| Web → Native | `window.postMessage` | `FORM_UPDATED`, `FILE_UPLOADED`, `PROGRESS`, `TOAST` |
| Native → Web | WebView `apiConfig` prop injection | Base URL, auth token, solutionId, schema, form data |

### Platforms

| Platform | Entry Point | Build Tool |
|----------|-------------|------------|
| Android / iOS | `index.js` | Metro bundler |
| Web / Desktop | `index.web.js` | Webpack 5 |
| Web Component (standalone) | `src/web-component/registerComponent.tsx` | Webpack 5 |

---

## 4. Offline Model

### Model Type: Edit-Only Offline

The system uses an **Edit-Only Offline Model**, meaning:

| Action | Offline Supported |
|--------|------------------|
| View participant details | ✅ |
| View project structure | ✅ |
| Execute tasks | ✅ |
| Edit observation forms | ✅ |
| Upload / attach files | ✅ |
| Create new entity | ❌ |
| Create new submission | ❌ |
| Submit form (change status to submitted) | ❌ |
| Login / authentication | ❌ |
| Real-time dashboard | ❌ |
| Auto sync | ❌ |

### Core Design Principles

1. **Participant-first** — participant is always the entry point
2. **Download-first** — data must be downloaded before offline usage
3. **Dependency-driven** — download follows the dependency chain strictly
4. **Manual sync control** — sync is always user-initiated
5. **Data integrity over convenience** — block features rather than risk corrupt data

### Dashboard Offline Support (Limited)

The interactive dashboard is **not supported offline**. However, snapshot-based access is available:

| Dashboard Feature | Offline |
|-------------------|---------|
| Download as image/XLS | ✅ |
| View downloaded snapshot (read-only) | ✅ |
| Interactive filters/drill-down | ❌ |
| Real-time data refresh | ❌ |

---

## 5. Features & Modules

### 5.1 Participant Module

- View participant details offline
- Access participant profile
- Participant is the **entry point** for all flows
- Each participant has an isolated data namespace: `participant:{id}:*`

### 5.2 Project Module

- Load project based on participant status:
  - **NOT_ONBOARDED** → Onboarding Project
  - **IN_PROGRESS / COMPLETED** → IDP Project
- View project structure: pillars → sections → tasks
- Execute tasks offline

### 5.3 Task Execution

Three task types are supported offline:

#### Simple Task
- Mark complete / incomplete offline
- Stored locally, synced later
- No additional dependencies

#### Upload Task
- Select and store file locally
- Link file to task
- File uploaded during sync
- Does **not** require pre-download (beyond participant/project)

#### Observation Task
- Opens the observation web component
- Requires: `entityId`, `submissionId`, `schema`, and `data` pre-downloaded
- Edit existing submission offline
- Saves to IndexedDB → bridge → offlineService
- Synced later

### 5.4 Observation Form Types

| Form | Status |
|------|--------|
| Household Profile (Not Onboarded) | Editable offline |
| Business Profiling | Editable offline |
| Record Asset Delivery (BigPush) | Requires file upload + acknowledgement |
| Individual Visit | Editable offline |
| Midline Survey | Editable offline |
| Intervention Plan | Editable offline |
| Endline Survey | Editable offline |

### 5.5 Offline Indicators

- Offline badge on participant card
- Sync status indicators (pending / success / failure)
- Module-level disabled states with fallback messaging
- Download progress indicators

---

## 6. Download Engine

### 6.1 Purpose

The Download Engine prepares complete offline data per participant. It is:
- **Dependency-driven** (not API-driven)
- **Crash-safe** (incremental storage)
- **Resume-friendly** (resumes from last completed step)
- **Idempotent** (re-download is safe)

### 6.2 Trigger & Input

```
User clicks "Download Offline"
  └── Input: { participantId, downloadConfig }
```

### 6.3 Download Pipeline

```
1. Validate input
2. Fetch participant
3. Fetch project
4. Fetch tasks
5. Process tasks (type-based)
6. Process observations (entity + submission)
7. Store data
8. Mark participant offline-enabled
```

### 6.4 downloadConfig Structure

```json
{
  "participant": true,
  "project": true,
  "tasks": true,
  "observation": {
    "logVisit": true,
    "householdProfile": true,
    "individualVisit": false,
    "midline": false,
    "interventionPlan": false,
    "endline": false
  },
  "files": true,
  "timestamp": 1710000000
}
```

### 6.5 Participant Status → Available Download Options

| Module | NOT_ONBOARDED | IN_PROGRESS | COMPLETED |
|--------|:---:|:---:|:---:|
| Participant Info | ✅ | ✅ | ✅ |
| Onboarding Project | ✅ | ❌ | ❌ |
| IDP Project | ❌ | ✅ | ✅ (read-only) |
| Log Visit | ✅ | ✅ | ❌ |
| Household Profile | ✅ | ❌ | ❌ |
| Individual Visit | ❌ | ✅ | ✅ |
| Midline Survey | ❌ | ✅ | ✅ |
| Intervention Plan | ❌ | ❌ | ✅ |
| Endline Survey | ❌ | ❌ | ✅ |

### 6.6 Observation Download Flow (Critical)

```
Step 1: GET observations/entities?solutionId={id}
  └── Find entity where externalId === participantId
  └── IF NOT FOUND → POST observations/updateEntities

Step 2: GET observationSubmissions/list
  └── IF submissionsCount === 0 → POST observationSubmissions/create
  └── (allowMultipleAssessments = false → only ONE submission)

Step 3: GET observations/assessment/{obId}
         ?entityId=xxx&submissionNumber=1&evidenceCode=OB

Step 4: Store:
  participant:{id}:form:{formId} → {
    entityId, submissionId, submissionNumber: 1,
    schema, data, status, updatedAt
  }
```

### 6.7 Retry & Resume

| Strategy | Detail |
|----------|--------|
| Retry per module | Max 3 retries with exponential backoff |
| Resume on crash | Resumes from `lastStep`, skips completed modules |
| Re-download safety | Compare `updatedAt`, preserve unsynced edits |

### 6.8 Download Status Tracking

```json
{
  "status": "in_progress | completed | partial | failed",
  "completedModules": ["participant", "project"],
  "failedModules": ["observation:midline"],
  "lastStep": "observation_processing"
}
```

**Storage key:** `participant:{id}:downloadStatus`

---

## 7. Observation Engine

### 7.1 Purpose

The Observation Engine manages:
- Rendering forms via the Web Component
- Entity and submission lifecycle management
- Edit-only offline model for forms
- Syncing form data back to server

### 7.2 Backend Data Model

```
Observation (solutionId)
  └── Entity (participantId as externalId)
        └── Submission (single instance)
              └── Schema + Data
```

**System Constraint:** `allowMultipleAssessments = false`
→ Only ONE submission exists. `submissionNumber` is always `1`.

### 7.3 Form Initialization (Native → Web Component)

```js
{
  entityId,
  submissionId,
  submissionNumber: 1,
  mockdata: { schema, data },
  offlineMode: true
}
```

### 7.4 Edit Data Flow

```
offlineService
  └── provides data ──► Web Component renders form
        └── User edits field
              └── Web Component writes to IndexedDB
                    └── postMessage (FORM_UPDATED)
                          └── Native offlineService stores edit
```

### 7.5 Bridge Message: FORM_UPDATED

```js
window.postMessage({
  type: "FORM_UPDATED",
  payload: {
    submissionId,
    data
  }
});
```

Native stores at: `participant:{id}:form:{formId}:edits`

### 7.6 Preconditions (Hard Rules)

Before any observation form can be opened (online or offline):

1. `entityId` must exist
2. `submissionId` must exist
3. `schema` must exist

**If any precondition fails → block the form.**

### 7.7 Observation Types → solutionId Mapping

| Observation Option | Source |
|-------------------|--------|
| Log Visit | observationId |
| Household Profile | project task |
| Individual Visit | observationId |
| Midline Survey | observationId |
| Intervention Plan | observationId |
| Endline Survey | observationId |

Each maps to: `project.tasks[] → filter(type = "observation") → solutionDetails.observationId`

---

## 8. File Upload Module

### 8.1 Purpose

File Upload handles:
- Capturing files for upload tasks and observation forms
- Storing files locally (offline-first)
- Linking files to tasks/submissions
- Uploading during sync and replacing local references with server URLs

### 8.2 Platform Storage Strategy

#### React Native

```
User selects file
  └── Store in device storage (react-native-fs)
  └── Generate fileId (UUID)
  └── Store path in offlineService
```

**File record:**
```json
{
  "fileId": "uuid",
  "localPath": "/storage/app/file.jpg",
  "fileType": "image",
  "linkedTo": { "participantId": "string", "formId": "string" },
  "syncStatus": "pending"
}
```

#### Web Component

```
User selects file
  └── Convert to base64/blob
  └── Store in IndexedDB
  └── Generate base64Key
  └── Attach key to form schema
  └── Emit postMessage (FILE_UPLOADED) → Native
```

**Bridge message:**
```js
window.postMessage({
  type: "FILE_UPLOADED",
  payload: { fileId, base64Key, formId }
});
```

### 8.3 File Linking Schema

**Observation form field:**
```json
{
  "fieldId": "upload_proof",
  "value": {
    "fileId": "uuid",
    "localRef": "path/base64Key",
    "syncStatus": "pending"
  }
}
```

**Upload task:**
```json
{
  "taskId": "string",
  "fileId": "uuid",
  "localRef": "...",
  "status": "pending"
}
```

### 8.4 Sync Flow

**Critical order:**
```
FILES → OBSERVATION UPDATE → TASK/PROJECT UPDATE
```

Steps:
1. Get all pending files
2. Upload file to server
3. Receive server URL / fileId
4. Update form/task JSON (replace `localRef` → `serverUrl`)
5. Mark file as synced

### 8.5 Storage Keys

```
participant:{id}:files:{fileId}
participant:{id}:files:pending
participant:{id}:files:synced
```

---

## 9. Storage Architecture

### 9.1 Core Principle

```
offlineService = SINGLE SOURCE OF TRUTH
```

IndexedDB (Web Component) is **temporary and UI-driven** — it must always sync into `offlineService`.

### 9.2 Storage Layers

| Platform | Technology | Data Type |
|----------|-----------|-----------|
| React Native | MMKV / AsyncStorage | JSON (participant, project, tasks, forms) |
| React Native | react-native-fs | Files (images, documents) |
| Web Component | IndexedDB | JSON + blobs (form data, files) |
| Web Component | LocalStorage | Flags |

### 9.3 Data Segmentation Strategy

All data is scoped by `participantId`:

```
participant:{id}:*
```

Benefits: easy cleanup, data isolation, safe sync, scalable.

### 9.4 Complete Storage Schema

#### Global Keys
```
participants:list
participants:offline:ids
storage:version
storage:limit
```

#### Participant Core
```
participant:{id}:details
participant:{id}:status
participant:{id}:lastSyncedAt
participant:{id}:downloadStatus
```

#### Project & Tasks
```
participant:{id}:project
participant:{id}:tasks
participant:{id}:project:edits
participant:{id}:project:syncStatus
```

#### Observation Forms
```
participant:{id}:form:{formId}          → base data
participant:{id}:form:{formId}:edits    → user edits
participant:{id}:form:{formId}:syncStatus
```

**Form data structure:**
```json
{
  "entityId": "string",
  "submissionId": "string",
  "submissionNumber": 1,
  "schema": {},
  "data": {},
  "status": "started | submitted",
  "updatedAt": "timestamp"
}
```

#### File Storage
```
participant:{id}:files:{fileId}
participant:{id}:files:pending
participant:{id}:files:synced
```

#### Sync Queue
```
sync:queue
sync:failed
sync:lastRun
```

#### LMS (Future)
```
lms:{moduleId}:video:path
lms:{moduleId}:pdf:path
lms:{moduleId}:video:progress
lms:{moduleId}:pdf:progress
```

### 9.5 Data Lifecycle

| Phase | Flow |
|-------|------|
| Download | `API → transform → store via offlineService` |
| Usage | `UI reads from offlineService` / `Web edits → IndexedDB → bridge → offlineService` |
| Sync | `read edits → push to server → merge → clear edits` |
| Cleanup | `remove participant data → free storage` |

### 9.6 IndexedDB Synchronization

**Problem:** Web Component writes to IndexedDB; native layer does not auto-receive updates.

**Solution:**
- On form open → sync IndexedDB → offlineService
- During edit → `postMessage` → offlineService update
- **Rule:** offlineService MUST always be latest before sync

### 9.7 Storage Management

| Concern | Strategy |
|---------|----------|
| Storage full | Block download, show error, suggest cleanup |
| LRU cleanup | Optional automatic eviction |
| Manual cleanup | Delete participant → deletes all associated data |
| Data expiry | `expiresAt` timestamp; expired → restrict usage, prompt re-download |
| Version mismatch | Invalidate and force re-download |

---

## 10. Sync Engine

### 10.1 Trigger

Sync is **always manually triggered** by the user — no background/auto sync.

### 10.2 Sync Execution Order (Critical)

```
1. Upload pending files
2. Update observation submissions
3. Update task/project state
```

This order is enforced because form data may reference uploaded file URLs.

### 10.3 Post-Sync Actions

- Clear local edits
- Mark participant as synced
- Update UI sync status
- Update `participant:{id}:lastSyncedAt`

### 10.4 Conflict Resolution

**Strategy:** `last-write-wins` based on `updatedAt` timestamp.

Applies when the same participant or submission is edited on multiple devices.

### 10.5 Observation Sync Payload

```json
{
  "submissionId": "string",
  "entityId": "string",
  "data": {},
  "files": []
}
```

**Rules:** Update ONLY existing submission. No creation APIs during sync.

**Status flow:** `started → submitted`

---

## 11. Participant Lifecycle Flow

### Phase 1 — Online Initialization

```
1. User logs in (internet required)
2. Fetch participant list
3. Open participant details
4. Fetch project (based on status)
5. Fetch task list
```

### Phase 2 — Offline Preparation (Download)

```
1. User clicks "Download Offline"
2. System calls getDownloadOptions(participantStatus)
3. Modal shows selectable modules (status-filtered)
4. User selects modules → stored in downloadConfig
5. Download Engine executes pipeline
```

**Observation task preparation within download:**
```
GET observations/entities
  └── Resolve entity (externalId = participantId)
        └── IF not found → POST updateEntities

GET observationSubmissions/list
  └── IF submissionsCount = 0 → POST create submission

GET observations/assessment
  └── Fetch schema + data

Store: entityId, submissionId, schema, data
```

### Phase 3 — Offline Usage

```
Load from offlineService:
  - participant details
  - project
  - tasks

Task Execution:
  Simple Task   → mark complete → store locally
  Upload Task   → select file → store locally → mark pending
  Observation   → open web component with entityId + submissionId + schema + data
```

### Phase 4 — Sync

```
User clicks "Sync"
  └── Upload files → Update observations → Update tasks/project
  └── Clear local edits → Mark synced → Update UI
```

### Dependency Chain Visualization

```
participant
  └── project
        └── tasks
              └── observation task
                    └── entity
                          └── submission
                                └── form schema + data
```

**Rule:** If any layer is missing → that feature is blocked offline.

---

## 12. Capability Matrix

| Feature | Offline | Editable | Requires Download | Notes |
|---------|:-------:|:--------:|:-----------------:|-------|
| Participant View | ✅ | ❌ | ✅ | Read-only |
| Project View | ✅ | ❌ | ✅ | Read-only |
| Simple Task | ✅ | ✅ | ✅ | Mark complete/incomplete |
| Upload Task | ✅ | ✅ | ❌ | File stored locally |
| Observation Form | ✅ | ✅ | ✅ | Edit only, no new submissions |
| File Upload | ✅ | ✅ | ❌ | Synced later |
| Sync | ✅ | — | — | Manual trigger, internet required |
| Login | ❌ | — | — | Always requires internet |
| Create Entity | ❌ | — | — | Not supported offline |
| Create Submission | ❌ | — | — | Must exist before download |
| Final Form Submit | ❌ | — | — | Status change requires internet |
| Dashboard | Snapshot only | ❌ | ✅ | Image/XLS snapshot only |

---

## 13. State Management & Data Flow

### offlineService

`offlineService` is the central state manager for all offline data. It:
- Acts as the single source of truth
- Abstracts platform-specific storage (MMKV/AsyncStorage/react-native-fs)
- Manages participant-scoped namespacing
- Handles read/write for participant, project, tasks, forms, files, sync queue

### IndexedDB (Web Component)

- Temporary storage within the Web Component scope
- Manages form field data and file blobs during editing
- Must always be synchronized to `offlineService` via bridge before sync

### Sync Queue

Pending sync operations are tracked in:
```
sync:queue    → operations pending sync
sync:failed   → operations that failed after max retries
sync:lastRun  → last successful sync timestamp
```

---

## 14. API Integration

### API Endpoints

#### Participant
```http
GET /participants/{id}
```

#### Project
```http
GET /projects/{projectId}
```

#### Observation — Entity
```http
GET  observations/entities?solutionId={solutionId}
POST observations/updateEntities
```

#### Observation — Submission
```http
GET  observationSubmissions/list
POST observationSubmissions/create
```

#### Observation — Form Data
```http
GET observations/assessment/{obId}?entityId=xxx&submissionNumber=1&evidenceCode=OB
```

### Request Flow (Download)

```
downloadConfig
  └── filter modules
        └── execute APIs per module (in dependency order)
              └── store results via offlineService
```

### Sync API Flow

```
1. Upload file → receive serverUrl
2. Update form data (replace localRef with serverUrl)
3. PUT/PATCH observationSubmissions/{id} (update submission data)
4. PATCH task state / project state
```

### Authentication

> **TODO:** Document authentication tokens/headers used in API calls. Verify token refresh behavior when returning online after offline session.

---

## 15. UI/UX Behavior

### Download Modal

- Shows selectable modules filtered by participant status
- Disables invalid options with tooltip explanations
- Pre-selects recommended modules
- Shows progress indicator per module during download
- Shows: success / partial success / failure result

### Offline State Indicators

- Offline badge on participant card (if downloaded for offline)
- Sync status icons: pending / syncing / synced / failed
- Disabled state for unavailable modules
- Fallback message: `"This module is not available offline"`

### Re-download Behavior

- System detects existing data
- Compares timestamps
- Updates only changed modules
- Preserves all unsynced edits

---

## 16. Failure Handling & Edge Cases

### Download Failures

| Case | Behavior |
|------|----------|
| Entity creation fails | Skip observation module, log error |
| Submission creation fails | Block observation, mark module failed |
| API failure | Retry (max 3, exponential backoff) |
| Storage failure | Stop download, show error |
| Status change mid-download | Re-validate, adjust available modules |

### Observation Form Failures

| Case | Behavior |
|------|----------|
| No `submissionId` | Block form (offline and online) |
| IndexedDB mismatch | Re-sync IndexedDB → offlineService |
| Corrupted data | Discard, prompt re-download |
| Sync failure | Retry |

### File Upload Failures

| Case | Behavior |
|------|----------|
| Upload failed | Keep in pending, retry later |
| Partial upload | Retry only failed files |
| File missing | Block sync, show error |
| Corrupted file | Discard, ask re-upload |
| App killed during upload | Resume on restart from pending queue |

### Partial Download

- Save all successfully downloaded modules
- Mark failed modules in `downloadStatus`
- Enable available modules in UI
- Disable unavailable modules with appropriate messaging
- Allow retry of failed modules

### Edge Cases

- App closed during edit → data preserved in IndexedDB + offlineService
- Network drop during sync → partial sync supported, resume on next attempt
- Same participant on multiple devices → `last-write-wins` by `updatedAt`
- Duplicate download trigger → idempotent; compare timestamps, update only changed data, preserve edits
- Large dataset → batch download/upload
- Storage full → block download, show cleanup prompt

---

## 17. Known Issues & Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| Multi-device conflict | Same participant edited on two devices offline | last-write-wins on sync; no merge UI |
| Missing entity/submission | Observation blocked if not created before download | Enforce creation during download phase |
| Storage exhaustion | Files consume large storage | Size validation, LRU cleanup, manual delete |
| IndexedDB desync | Web component data not synced to offlineService | Sync on form open + postMessage on every change |
| Partial download blocking features | Incomplete download leads to blocked modules | Show clear per-module status and retry options |
| Status change between download and use | Participant status changes server-side | Re-validate on next download |

---

## 18. Pending Tasks / Future Improvements

### High Priority

- [ ] Implement `offlineService` as single source of truth across all modules
- [ ] Enforce observation dependency chain validation before form open
- [ ] Implement `downloadStatus` tracking with module-level granularity
- [ ] Implement bridge sync (postMessage handling) for `FORM_UPDATED` and `FILE_UPLOADED`
- [ ] Implement file upload → server URL replacement before form sync

### Medium Priority

- [ ] Storage limit tracking and cleanup UI
- [ ] Data expiry (`expiresAt`) enforcement
- [ ] Re-download with timestamp comparison and edit preservation
- [ ] Retry queue with exponential backoff

### Future / Optional

- [ ] LMS offline module (video/PDF download with progress tracking)
- [ ] Background sync (requires OS-level support)
- [ ] Conflict resolution UI for multi-device edits
- [ ] Analytics on offline usage patterns

---

## 19. Critical Rules Reference

> These rules are non-negotiable and must be enforced at every layer.

### Download Rules
- Download is **selective, not a full data dump**
- Download options depend on **participant status**
- Observation download **must ensure entity + submission exist**
- `downloadConfig` drives all execution
- Partial download must be supported
- Re-download must be **safe** (no data loss, preserve unsynced edits)
- Download must be **idempotent**

### Observation Rules
- `entityId` + `submissionId` are required before any form can open
- `submissionNumber` = `1` ALWAYS
- Only **ONE submission** per observation (no multiple assessments)
- No submission creation offline
- Entity must exist before offline usage

### Storage Rules
- `offlineService` is the **ONLY** source of truth
- IndexedDB is **temporary**
- All data must be **participant-scoped** (`participant:{id}:*`)
- Always sync IndexedDB → offlineService before use
- Always validate before render

### Sync Rules
- Sync order is enforced: **FILES → OBSERVATION → TASK/PROJECT**
- Always replace `localRef` with `serverUrl` after file upload
- Sync is **manual only** — no background sync

---

## 20. Developer Notes

### Dependency Chain Must Be Respected

Always follow this chain during download and validation:
```
participant → project → tasks → observation → entity → submission → schema + data
```

Never skip a level. If a level is missing, block downstream features — do not attempt to work around it.

### offlineService Is Always Authoritative

Any data written to IndexedDB by the Web Component is considered **draft**. The bridge (`postMessage`) must be called, and `offlineService` must receive and persist the update before it is considered durable.

### submissionNumber Is Always 1

`allowMultipleAssessments = false` means there is always exactly one submission. Hard-code `submissionNumber = 1` — do not make this dynamic.

### File Sync Must Precede Form Sync

Files must be uploaded to the server and their local references replaced with server URLs **before** the form data is synced. If files are not uploaded first, the form data will contain invalid local references.

### Re-download Is Safe By Design

The download engine is idempotent. Trigger it any number of times — it will compare timestamps and only update changed data while preserving unsynced local edits.

---

## 21. Appendix

### A. Observation Dependency Flow (Extended)

```
Coach visits participant (offline)
  └── Opens participant from offlineService
        └── Loads project + tasks
              └── Finds observation task
                    └── Checks: entityId exists? submissionId exists?
                          └── YES → Open Web Component
                                └── Web Component renders form from schema + data
                                      └── Coach edits form
                                            └── postMessage → offlineService stores edits
                          └── NO → Block form with error message
```

### B. Sync Flow (Extended)

```
User triggers sync (internet available)
  └── Step 1: Get pending files (participant:{id}:files:pending)
        └── Upload each file → receive serverUrl
              └── Update form data (replace localRef → serverUrl)
                    └── Mark file as synced

  └── Step 2: Get observation edits (participant:{id}:form:{formId}:edits)
        └── POST/PUT to observationSubmissions API
              └── Clear local edits
                    └── Update sync status

  └── Step 3: Get task/project edits
        └── Update server state
              └── Clear local edits

  └── Mark participant lastSyncedAt
        └── Update UI
```

### C. Participant Status → Project Type

| Status | Project Type |
|--------|-------------|
| NOT_ONBOARDED | Onboarding Project |
| IN_PROGRESS | IDP Project |
| COMPLETED | IDP Project (may be read-only) |

### D. Storage Version Handling

```
storage:version  → global schema version

On app update:
  IF version mismatch → invalidate all data → prompt re-download
```

### E. File Type Restrictions

> **TODO:** Document allowed file types, maximum file sizes, and compression strategy for images before local storage.

---

---

## 22. Source Documents

The wiki above is compiled from the following original planning documents. Read these for full raw detail, exact API examples, and additional edge-case notes.

| # | Section | Source File | Key Topics |
|---|---------|-------------|------------|
| 1A | Program Context & Offline Need | [SECTION 1A — PROGRAM CONTEXT, OFFLINE NEED & CAPABILITY PRE-REQUISITES.md](<SECTION 1A — PROGRAM CONTEXT, OFFLINE NEED & CAPABILITY PRE-REQUISITES.md>) | Problem context, offline objectives, capability overview, dashboard snapshot, design principles |
| 1B | Participant Lifecycle Flow | [SECTION 1B — PARTICIPANT LC FLOW.md](<SECTION 1B — PARTICIPANT LC FLOW.md>) | Phase 1–4 flow, observation sub-layer, multi-device strategy, architecture overview |
| 2 | Scope, Capabilities & Pre-Requisites | [SECTION 2 — SCOPE, CAPABILITIES & PRE-REQUISITES.md](<SECTION 2 — SCOPE, CAPABILITIES & PRE-REQUISITES.md>) | In-scope / out-of-scope list, full capability matrix, dependency chain, failure handling |
| 3 | Download Options & Status Behavior | [SECTION 3 — CAPABILITIES, DOWNLOAD OPTIONS & STATUS-BASED BEHAVIOR.md](<SECTION 3 — CAPABILITIES, DOWNLOAD OPTIONS & STATUS-BASED BEHAVIOR.md>) | downloadConfig structure, status-to-module mapping, validation, re-download, edge cases |
| 4 | Download Engine | [SECTION 4 — DOWNLOAD ENGINE.md](<SECTION 4 — DOWNLOAD ENGINE.md>) | Full pipeline steps, observation processing flow, retry/resume strategy, idempotency, performance |
| 5 | Observation Engine | [SECTION 5 — OBSERVATION ENGINE.md](<SECTION 5 — OBSERVATION ENGINE.md>) | Entity/submission lifecycle, web component init, bridge messages, conflict handling, validation |
| 6 | Storage Architecture | [SECTION 6 — STORAGE ARCHITECTURE.md](<SECTION 6 — STORAGE ARCHITECTURE.md>) | Storage layers, full key schema, data segmentation, IndexedDB sync, versioning, security |
| 7 | File Upload | [SECTION 7 — FILE UPLOAD.md](<SECTION 7 — FILE UPLOAD.md>) | Platform strategies, bridge integration, file linking, sync order, cleanup, performance |

---

*Wiki compiled from: Coach Offline Plan v2 — Sections 1A, 1B, 2, 3, 4, 5, 6, 7*

---

## 23. Implementation Corrections & Verified API Details

> Added 2026-05-14 after full codebase + API audit. These details override any vague references in earlier sections.

### 23.1 Participant Details API

**Wrong (do not use):**
```
GET /api/entity-management/v1/entities/details/{participantId}
```

**Correct:**
```
GET /api/project/v1/programUsers/entities
  ?userId={lcUserId}        ← the LC's own user ID (not participant)
  &entityId={participantId} ← the specific participant
  &type=user
  &page=1&limit=1
  &programId={GLOBAL_LC_PROGRAM_ID}
```

`lcUserId` is the logged-in LC's ID, not the participant's ID. The download engine requires this as `StartDownloadParams.lcUserId` so it can scope the API call correctly.

### 23.2 Observation Submission Sync API

**Wrong (do not use for syncing edits):**
```
POST /api/survey/v1/observationSubmissions/create/{observationId}
```
This endpoint **creates** a new submission. Using it for sync creates duplicate records.

**Correct (for pushing offline edits back to server):**
```
POST /api/survey/v1/observationSubmissions/update/{observationId}?entityId={entityId}
Body: { submissionId: string, answers: Record<string, any> }
```

The sync service must:
1. Parse `observationId` (= formId) from the key `participant:{id}:form:{formId}:edits`
2. Load `participant:{id}:form:{formId}` to get `entityId`
3. POST to the update endpoint above

### 23.3 Observation Schema Validation (Blocking Rule)

After fetching the assessment in `processObservationTask` (download step 4), validate:
```typescript
if (!schema || Object.keys(schema).length === 0)
  throw new Error('Empty schema');
if (!schema.assessment?.evidences?.length)
  throw new Error('Schema missing evidences');
```
If validation fails, throw and let the calling code mark the module as failed. Never store an empty/invalid schema — the form cannot render offline without it.

### 23.4 Offline Badge Component

A small `OfflineBadge` component renders per-row in the participant list (inside `ActionColumn`):

| Download status | Visual |
|-----------------|--------|
| `completed` | Green wifi-off icon |
| `partial` | Amber alert icon |
| `in_progress` | Spinner |
| `failed` | Red wifi-off icon |
| `null` / not downloaded | Nothing (hidden) |

- Reads `participant:{id}:downloadStatus` from offlineStorage on mount
- Re-reads whenever `refreshKey` prop increments (e.g. after a download completes)
- Does not block render — async, non-fatal

### 23.5 Per-Participant `lastSyncedAt`

After a fully successful sync for a participant (0 failed items), write:
```
participant:{id}:lastSyncedAt → Date.now()  (stored as number/ms)
```
This supplements the global `sync:lastSync` key. It allows the badge or detail screen to show "last synced X minutes ago" per participant rather than a single global timestamp.

---

## Section 24 — Revised Storage Architecture (2026-05-14)

### 24.1 Storage Routing (IndexedDB vs AsyncStorage)

On **web**, all keys with the following prefixes are routed to a dedicated IndexedDB store (`gbl-offline-db` / `offline-data`):

| Key prefix | Reason |
|------------|--------|
| `participant:*` | Large observation schemas, project data, form edits |
| `participants:*` | Offline participant ID registry, list cache |
| `sync:*` | Sync failure log, last-sync timestamps |

All other keys (auth tokens, settings, preferences) continue to use AsyncStorage (→ localStorage on web).

On **native** (iOS/Android) all keys use AsyncStorage as before.

The routing is transparent — callers use the same `offlineStorage.create/read/remove` API. No caller-side changes needed.

### 24.2 Participant Storage Deduplication

Two keys exist per participant — each has a distinct purpose:

| Key | Content | Written by |
|-----|---------|------------|
| `participant:{id}:details` | Full entity record from `programUsers/entities` API | `downloadService.fetchAndStoreParticipant` |
| `participant:{id}:listSnapshot` | Minimal display row (passed as `participantSnapshot` at download time) | `downloadService.startDownload` |

`listSnapshot` is the only data read when rendering the offline participant list. `details` is read for the participant detail screen. There is no third copy.

### 24.3 Project / Tasks Normalization

Tasks are **not stored in a separate key**. They live inside the project object:

```
participant:{id}:project  →  { _id, title, tasks: [...], ... }
```

`dataService.getTasks` extracts `project.tasks ?? project.children` from the stored project. `downloadService.fetchAndStoreProject` writes only the project key (removed the old `participant:{id}:tasks` write).

### 24.4 Observation Download Flow (Corrected)

```
solutionId  =  task.solutionDetails._id | .observationId | .id

1. GET  observations/entities?solutionId={solutionId}
         → entitiesResp.result._id  = realObservationId  ← USE THIS for all subsequent calls
         → entitiesResp.result.entities[]  = mapped entity list

2. Match entity by externalId or _id === participantId
   If not found:
     a. POST observations/updateEntities/{realObservationId}  { data: [participantId] }
     b. POST observations/searchEntities?observationId={realObservationId}&search={participantId}
        → find entity in result; get entityId = entity._id

3. GET/POST observationSubmissions/list  → submissionId
   If none: POST observationSubmissions/create  → submissionId

4. GET observations/assessment?observationId={realObservationId}&entityId={entityId}&submissionNumber=1&evidenceCode=OB
   → schema; validate schema.assessment.evidences.length > 0

5. Store: participant:{id}:form:{realObservationId}  →  ObservationFormData
```

### 24.5 ProjectPlayer mockData Support

`useProjectLoader` now short-circuits when `data.data` is already provided:

```typescript
// In useProjectLoader — edit/read-only mode
if (data.data) {
  setProjectData(data.data);
  return; // skip all API calls
}
```

Callers (e.g. offline participant detail screen) can pass the cached project directly via `data={{ data: cachedProject }}` to avoid redundant API calls when the project is already loaded from IndexedDB.

Project creation is also guarded against offline state: if `!projectId` and `isNetworkOffline()`, an error is thrown immediately instead of attempting API calls that would fail.

### 24.6 Offline Participant List Search & Overview

When offline, `dataService.getParticipantList` applies:

1. **Client-side search** — filters snapshots by `firstName + lastName` and `externalId`
2. **Client-side status filter** — filters by `status` / `accountUserStatus` field
3. **Computed overview counts** — counts snapshots by status field; no separate overview API call

```typescript
const overview = computeOfflineOverview(allParticipants);
// → { total: N, active: X, inactive: Y, notOnboarded: Z, ... }
```

### 24.7 OfflineBadge UX

The badge now shows both an icon **and** a translated text label:

| State | Icon | Label (i18n key) |
|-------|------|-----------------|
| `completed` | WifiOff (green) | `offlineSync.available` → "Offline" |
| `partial` | AlertCircle (amber) | `offlineSync.partial` → "Partial" |
| `in_progress` | Spinner (blue) | `offlineSync.downloading` → "Downloading…" |
| `failed` | WifiOff (red) | `offlineSync.downloadFailed` → "Failed" |
| not downloaded | — | hidden |
