## <!-- SECTION 2 -->

# 📘 SECTION 2 — SCOPE, CAPABILITIES & PRE-REQUISITES

---

# 2. SCOPE & OFFLINE CAPABILITY DEFINITION

---

## 2.1 Purpose of This Section

This section clearly defines:

- What works offline (INSCOPE)
- What does NOT work offline (OUTSCOPE)
- What must be downloaded before usage (PRE-REQUISITES)

👉 This is critical for:

- QA validation
- Client expectation alignment
- Dev implementation clarity

---

## 2.2 In-Scope (Offline Supported Features)

---

### 2.2.1 Participant Module

- View participant details offline
- Access participant profile
- Use participant as entry point for all flows

---

### 2.2.2 Project Module

- Load project (Onboarding / IDP based on status)

- View project structure:

  - pillars
  - sections
  - tasks

- Execute tasks offline

---

### 2.2.3 Task Execution (ALL TYPES)

---

#### ✅ Simple Task

- Mark complete/incomplete
- Stored locally
- Synced later

---

#### ✅ Upload Task

- Select/upload file offline
- File stored locally
- Synced later

---

#### ✅ Observation Task

- Open form (via web component)
- Edit existing submission
- Save locally
- Sync later

---

### 2.2.4 Observation Forms

Supported types:

- Household Profile (Not Onboarded)
- Business Profiling
- Record Asset Delivery (BigPush)
- Individual Visit
- Midline Survey
- Intervention Plan
- Endline Survey

---

### 2.2.5 File Upload

- Capture/store files offline
- Link files to tasks/forms
- Upload during sync

---

### 2.2.6 Sync & Submission

- Manual sync trigger
- File upload → form update → task/project update
- Retry on failure
- Partial sync supported

---

### 2.2.7 Offline Indicators

- Offline badge on participant
- Sync status indicators
- Pending/success/failure states

---

## 2.3 Out-of-Scope (NOT Supported Offline)

---

### ❌ Authentication

- Login/logout requires internet

---

### ❌ Entity Creation

- Cannot create observation entity offline

---

### ❌ Submission Creation

- Cannot create submission offline
- Must exist during download

---

### ❌ Final Form Submission

- Cannot change status (started → submitted) offline

---

### ❌ Real-Time Features

- Live dashboards
- Reports
- Analytics

---

### ❌ Background Sync

- No automatic sync
- Only manual trigger

---

### ❌ Multi-User Collaboration

- No real-time conflict resolution UI

---

## 2.4 Capability Matrix (FINAL)

| Feature     | Offline | Editable | Requires Download |
| ----------- | ------- | -------- | ----------------- |
| Participant | ✅      | ❌       | ✅                |
| Project     | ✅      | ❌       | ✅                |
| Simple Task | ✅      | ✅       | ✅                |
| Upload Task | ✅      | ✅       | ❌                |
| Observation | ✅      | ✅       | ✅                |
| File Upload | ✅      | ✅       | ❌                |
| Sync        | ✅      | —        | —                 |

---

## 2.5 Pre-Requisites (CRITICAL — MUST BE ENFORCED)

---

## 2.5.1 Participant-Level

Must have:

- participant details
- project details
- task list

---

## 2.5.2 Task-Level

---

### Simple Task

- No extra dependency

---

### Upload Task

- File storage capability available

---

### Observation Task (VERY IMPORTANT)

Must have:

```text
entityId
submissionId
submissionNumber = 1
schema + data
```

---

### Hard Rule

```text
IF submissionId missing
→ BLOCK form
```

---

## 2.5.3 Observation Dependency Chain

```text
participant
  → project
    → tasks
      → observation task
        → entity
          → submission
            → form schema + data
```

👉 If any layer missing → feature must be blocked

---

## 2.5.4 LMS (If enabled later)

Must have:

- media downloaded

---

## 2.6 Download Requirements (WHAT MUST BE FETCHED)

---

### Mandatory Data

- participant details
- project
- tasks

---

### Observation Data

- entity mapping
- submission (must exist)
- schema + data

---

### File Metadata

- task-level file requirements

---

## 2.7 Failure Handling (Scope Level)

---

### Missing Download Data

- Block feature
- Show fallback:
  `"This module is not available offline"`

---

### Partial Download

- Enable available modules
- Disable missing ones

---

### Corrupted Data

- Force re-download

---

## 2.8 UI/UX Expectations

---

- Clear offline indicators
- Disabled state for unavailable modules
- Sync status visibility
- Error messaging for missing prerequisites

---

## 2.9 Critical Rules (FINAL)

---

- ❗ Participant is entry point
- ❗ Project + tasks drive the flow
- ❗ Observation is task type
- ❗ Entity + submission must exist before offline
- ❗ Only ONE submission allowed
- ❗ No submission creation offline
- ❗ Offline usage depends on download completeness

---
