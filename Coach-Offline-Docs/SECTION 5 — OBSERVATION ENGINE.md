## <!-- SECTION 5 -->

# 📘 SECTION 5 — OBSERVATION ENGINE

---

# 5. OBSERVATION ENGINE (ENTITY + SINGLE SUBMISSION + WEB COMPONENT INTEGRATION)

---

## 5.1 Purpose

The Observation Engine handles:

- Rendering observation forms (via Web Component)
- Managing **entity + submission lifecycle**
- Supporting **edit-only offline model**
- Syncing updated form data back to server

---

## 5.2 Core System Model (VERY IMPORTANT)

---

### Backend Structure

```text id="6xg9vn"
Observation (solutionId)
  → Entity (mapped using participantId as externalId)
    → Submission (form instance)
      → Schema + Data
```

---

### System Constraint

```json id="0h3wle"
{
  "allowMultipleAssessments": false
}
```

---

### Implication

```text id="c9vx5n"
ONLY ONE submission exists
submissionNumber = 1 (ALWAYS)
```

---

## 5.3 Role in LC Flow

```text id="lg6c92"
Participant
  → Project
    → Tasks
      → Observation Task
        → Observation Engine
```

👉 Observation is **invoked only via task execution**

---

## 5.4 Preconditions (MANDATORY)

---

### Before Offline Usage

System MUST ensure:

---

#### 1. Entity Exists

```http id="cz1cfx"
GET observations/entities?solutionId
→ match externalId = participantId
```

IF NOT FOUND:

```http id="n7pd4x"
POST observations/updateEntities
```

---

#### 2. Submission Exists

```http id="l4j4cz"
GET observationSubmissions/list
```

IF `submissionsCount = 0`:

```http id="v6w3qp"
POST observationSubmissions/create
```

---

### 🚨 Hard Rule

```text id="8u8vlu"
IF submissionId NOT available
→ BLOCK form (offline & online)
```

---

## 5.5 Download Phase (Observation Preparation)

---

### Flow

```text id="d94a3n"
1. Resolve entity
2. Ensure submission exists
3. Fetch assessment (schema + data)
4. Store offline
```

---

### API

```http id="l6v64z"
GET observations/assessment/{obId}
?entityId=xxx
&submissionNumber=1
&evidenceCode=OB
```

---

### Storage

```text id="nj8z8v"
participant:{id}:form:{formId} → {
  entityId,
  submissionId,
  submissionNumber: 1,
  schema,
  data,
  status,
  updatedAt
}
```

---

## 5.6 Observation Types (TASK-BASED)

---

### 5.6.1 Household Profile (Not Onboarded)

- From project task
- Editable offline

---

### 5.6.2 Business Profiling (IDP)

- Observation task
- Editable offline

---

### 5.6.3 Record Asset Delivery (BigPush)

- Requires:

  - file upload
  - acknowledgement

---

### 5.6.4 Other Observations

- Individual Visit
- Midline
- Intervention Plan
- Endline

---

## 5.7 Web Component Integration (CORE ARCHITECTURE)

---

### Responsibility Split

| Layer                   | Responsibility          |
| ----------------------- | ----------------------- |
| Web Component           | UI + schema + IndexedDB |
| IndexedDB               | temporary storage       |
| Native (offlineService) | final storage + sync    |

---

## 5.8 Form Initialization (Native → Web)

```js id="1o3bzi"
{
  entityId,
  submissionId,
  submissionNumber: 1,
  mockdata: { schema, data },
  offlineMode: true
}
```

---

## 5.9 Data Flow (EDIT FLOW)

---

### Step 1: Load

```text id="m3h0m2"
offlineService → provide data → web component
```

---

### Step 2: Edit

- Web updates IndexedDB on every field change

---

### Step 3: Bridge Sync (MANDATORY)

```js id="3g3hcl"
window.postMessage({
  type: "FORM_UPDATED",
  payload: {
    submissionId,
    data,
  },
});
```

---

### Step 4: Native Store

```js id="3r0mjq"
offlineService.set(
  participant:{id}:form:{formId}:edits,
  payload
)
```

---

## 5.10 IndexedDB Sync Handling

---

### Case: App Reopen

```text id="7n6xre"
Web IndexedDB may have latest data
→ sync to offlineService before usage
```

---

### Rule

```text id="n9b3n4"
offlineService must always be latest before sync
```

---

## 5.11 File Upload Integration

---

### Storage

| Platform | Storage            |
| -------- | ------------------ |
| RN       | file path          |
| Web      | base64 (IndexedDB) |

---

### Linking in Form

```json id="9h0s2w"
{
  "fileId": "uuid",
  "localRef": "path/base64Key",
  "syncStatus": "pending"
}
```

---

### Sync Order

```text id="5g6p6m"
FILES → FORM UPDATE
```

---

## 5.12 Sync Behavior

---

### Payload

```json id="4z3gk2"
{
  "submissionId": "string",
  "entityId": "string",
  "data": {},
  "files": []
}
```

---

### Rules

- Update ONLY submission
- No creation APIs
- Maintain status

---

### Status Flow

```text id="6s2n2x"
started → submitted
```

---

## 5.13 Conflict Handling

---

### Scenario

Multiple devices edit same submission

---

### Strategy

```text id="8p5c7q"
last-write-wins (updatedAt)
```

---

## 5.14 Validation Rules

---

### Before Render

- entityId exists
- submissionId exists
- schema exists

---

### Before Sync

- required fields valid
- files uploaded

---

## 5.15 Failure Handling

---

### No submissionId

→ block form

---

### Sync failure

→ retry

---

### IndexedDB mismatch

→ re-sync

---

### Corrupted data

→ re-download

---

## 5.16 Edge Cases

---

- app closed after edit
- network drop during sync
- file missing before sync
- server data newer than local

---

## 5.17 Critical Rules (FINAL)

---

- ❗ Observation is task-driven
- ❗ Entity must exist before usage
- ❗ Submission must exist before usage
- ❗ Only ONE submission allowed
- ❗ No submission creation offline
- ❗ offlineService = source of truth
- ❗ IndexedDB is temporary

---
