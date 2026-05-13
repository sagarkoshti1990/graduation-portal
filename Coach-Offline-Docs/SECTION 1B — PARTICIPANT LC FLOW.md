## <!-- SECTION 1B -->

# 📘 SECTION 1B — PARTICIPANT LC FLOW

---

# 1B. PARTICIPANT LIFECYCLE FLOW (ONLINE → OFFLINE → SYNC)

---

## 1B.1 Overview

The system follows a **participant-driven lifecycle**, where all operations originate from the participant and flow through:

```text id="flow1"
Participant → Project → Tasks → Execution → Sync
```

---

### Key Understanding

- Participant is the **entry point**
- Project defines the **structure**
- Tasks define the **actions**
- Observation is a **type of task**

---

## 1B.2 Phase 1 — Online Initialization

---

```text id="phase1"
1. User logs in (internet required)
2. Fetch participant list
3. Open participant details
4. Fetch project (based on status)
5. Fetch task list
```

---

### Output of Phase 1

- participant details loaded
- project identified (Onboarding / IDP)
- tasks available for execution

---

## 1B.3 Phase 2 — Offline Preparation (Download)

---

```text id="phase2"
1. User clicks "Download Offline"
2. System prepares data based on selection
```

---

### Data Fetched

```text id="download_data"
- participant details
- project details
- task list
```

---

## 1B.4 Task Handling During Download

---

```text id="task_handling"
For each task:

Simple Task:
→ store metadata

Upload Task:
→ store file config

Observation Task:
→ dependency-based preparation
```

---

## 1B.5 Observation Task Preparation (CRITICAL FLOW)

---

```text id="obs_flow"
1. GET observations/entities
2. Resolve entity (externalId = participantId)

IF not found:
→ search + updateEntities

3. GET observationSubmissions/list

IF submissionsCount = 0:
→ create submission

4. GET observations/assessment
→ fetch schema + data
```

---

### Output

```text id="obs_output"
entityId
submissionId
schema
existing data
```

---

## 1B.6 Store Offline

---

```text id="store1"
Store:
- participant
- project
- tasks
- observation (entity + submission + schema + data)
```

---

### Mark Participant Ready

```text id="ready1"
participant → offline-enabled
```

---

## 1B.7 Phase 3 — Offline Usage

---

### Open Participant

```text id="offline_open"
Load from offlineService:
- participant details
- project
- tasks
```

---

## 1B.8 Task Execution Flow

---

### 1. Simple Task

```text id="simple_task"
mark complete → store locally
```

---

### 1B. Upload Task

```text id="upload_task"
select file → store locally → mark pending
```

---

### 3. Observation Task

```text id="obs_task"
open web component with:
- entityId
- submissionId
- schema + data
```

---

## 1B.9 Observation Form Flow (WEB + NATIVE)

---

```text id="form_flow"
1. Web component renders form
2. User edits fields
3. Data saved in IndexedDB
4. Bridge sync → offlineService
```

---

### Important Rule

```text id="rule_obs"
offlineService must always have latest data
```

---

## 1B.10 Phase 4 — Sync Flow

---

### Manual Trigger

```text id="sync1"
User clicks "Sync"
```

---

### Sync Execution Order (CRITICAL)

```text id="sync_order"
1. Upload files
2. Update observation submissions
3. Update task/project state
```

---

### Post Sync

```text id="sync_post"
- clear local edits
- mark synced
- update UI
```

---

## 1B.11 Observation System (SUB-LAYER)

---

### Backend Model

```text id="obs_model"
Observation
  → Entity (participant mapping)
    → Submission (single)
      → Form schema + data
```

---

### Constraint

```text id="obs_constraint"
allowMultipleAssessments = false
→ ONLY ONE submission
→ submissionNumber = 1
```

---

### Rule

```text id="obs_rule"
No entity / no submission
→ form cannot be opened
```

---

## 1B.12 Architecture Overview

---

```text id="arch1"
Participant
  → Project
    → Tasks
      → Observation (Web Component)
        → IndexedDB (temporary)
        → Bridge Layer
        → offlineService (source of truth)
        → Sync Engine
        → Backend
```

---

## 1B.13 Multi-Device Consideration

---

### Scenario

- Same participant accessed on multiple devices

---

### Strategy

```text id="multi_device"
last-write-wins (based on updatedAt)
```

---

## 1B.14 Edge Cases

---

- partial download
- missing observation dependency
- app closed during edit
- sync failure
- file upload failure

---

## 1B.15 Success Criteria

---

- participant flow works offline end-to-end
- tasks execute without errors
- observation forms load correctly
- sync completes successfully
- no data loss

---

## 1B.16 Critical Rules (FINAL)

---

- ❗ Participant is entry point
- ❗ Project + tasks drive execution
- ❗ Observation is task-based
- ❗ entityId + submissionId required
- ❗ submissionNumber = 1 always
- ❗ offlineService = source of truth
- ❗ IndexedDB is temporary

---
