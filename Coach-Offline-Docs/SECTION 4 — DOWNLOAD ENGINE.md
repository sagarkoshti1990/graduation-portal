## <!-- SECTION 4 -->

# 📘 SECTION 4 — DOWNLOAD ENGINE

---

# 4. DOWNLOAD ENGINE (PARTICIPANT-CENTRIC, DEPENDENCY-AWARE)

---

## 4.1 Purpose

The Download Engine is responsible for:

- Preparing **complete offline data per participant**
- Resolving all **dependencies (project → tasks → observation → entity → submission)**
- Executing **controlled API calls**
- Storing data safely via **offlineService**
- Supporting **retry, resume, and partial download**

---

## 4.2 Core Principle

```text id="jz6n8c"
Download is dependency-driven, not API-driven
```

👉 Meaning:

- Do NOT call APIs blindly
- Always follow:

  ```text
  participant → project → tasks → observation → entity → submission
  ```

---

## 4.3 Engine Entry Point

---

### Trigger

```text id="c1ph5x"
User clicks → Download Offline
```

---

### Input

```json id="k4f9m1"
{
  "participantId": "string",
  "downloadConfig": { ... }
}
```

---

### Output

- Offline-ready participant
- Stored data
- Download status

---

## 4.4 High-Level Pipeline

```text id="b87k0m"
1. Validate input
2. Fetch participant
3. Fetch project
4. Fetch tasks
5. Process tasks (type-based)
6. Process observations (entity + submission)
7. Store data
8. Mark participant offline-enabled
```

---

## 4.5 Detailed Execution Flow

---

## 4.5.1 Step 1 — Fetch Participant

```http id="nvt2m7"
GET /participants/{id}
```

---

### Store

```text id="3qzv7f"
participant:{id}:details
participant:{id}:status
```

---

---

## 4.5.2 Step 2 — Fetch Project

```http id="o2njrm"
GET /projects/{projectId}
```

(ProjectId derived from participant)

---

### Store

```text id="8m6cgh"
participant:{id}:project
```

---

---

## 4.5.3 Step 3 — Extract Tasks

```text id="tgz4ea"
project.tasks[]
```

---

### Store

```text id="d5m1q8"
participant:{id}:tasks
```

---

---

## 4.5.4 Step 4 — Process Tasks (TYPE-BASED)

---

### 🔹 Simple Task

```text id="gk9o3m"
store metadata only
```

---

### 🔹 Upload Task

```text id="a0v4fn"
store:
- file config
- validation rules
```

---

### 🔹 Observation Task (CRITICAL FLOW)

---

## 4.6 Observation Processing (DETAILED)

---

### Step 1: Fetch Entities

```http id="m1c6gz"
GET observations/entities?solutionId={solutionId}
```

---

### Step 2: Resolve Entity

```text id="3pxc2t"
find entity.externalId === participantId
```

---

### IF NOT FOUND

```http id="s7vljr"
POST observations/updateEntities
```

---

---

### Step 3: Fetch Submission List

```http id="2m64ks"
GET observationSubmissions/list
```

---

### Step 4: Ensure Submission Exists

```text id="9phm5g"
IF submissionsCount == 0
   → POST observationSubmissions/create
```

---

👉 Because:

```text id="jbtb4t"
allowMultipleAssessments = false
→ ONLY ONE submission
```

---

---

### Step 5: Fetch Form Data

```http id="n7bl7d"
GET observations/assessment/{obId}
?entityId=xxx
&submissionNumber=1
&evidenceCode=OB
```

---

### Step 6: Store

```text id="v7y2fk"
participant:{id}:form:{formId} → {
  entityId,
  submissionId,
  submissionNumber: 1,
  schema,
  data,
  status
}
```

---

## 4.7 Storage Strategy (DURING DOWNLOAD)

---

### Incremental Storage

```text id="az1v9x"
store after EACH successful step
```

---

👉 Benefit:

- crash-safe
- resume-friendly

---

---

## 4.8 Download State Tracking

---

### Key

```text id="l1t2kp"
participant:{id}:downloadStatus
```

---

### Example

```json id="6g7z1p"
{
  "status": "in_progress | completed | partial | failed",
  "completedModules": ["participant", "project"],
  "failedModules": ["observation:midline"],
  "lastStep": "observation_processing"
}
```

---

## 4.9 Partial Download Handling

---

### Scenario

- Some modules fail

---

### Behavior

- Save successful data
- Mark failed modules
- Allow retry

---

## 4.10 Retry Strategy

---

### Rules

- Retry per module
- Max retry = 3
- Exponential backoff

---

### Retry Scope

```text id="h3c4q9"
ONLY failed modules
```

---

## 4.11 Resume Strategy (CRITICAL)

---

### Scenario

App crashes mid-download

---

### On Restart

```text id="9gxqsy"
resume from lastStep
skip completed modules
```

---

---

## 4.12 Idempotency (VERY IMPORTANT)

---

### Problem

Multiple downloads → duplicate data

---

### Solution

```text id="p5zq5v"
same input → same output
```

---

### Rules

- overwrite safely
- no duplicate storage
- preserve unsynced edits

---

---

## 4.13 Re-download Behavior

---

### Scenario

User downloads again

---

### System Must

```text id="0htazd"
compare updatedAt
update only changed data
preserve:
- form edits
- pending files
```

---

---

## 4.14 Failure Handling

---

### Case 1: Entity creation fails

→ skip observation
→ log error

---

### Case 2: Submission creation fails

→ block observation
→ mark module failed

---

### Case 3: API failure

→ retry
→ mark failed after limit

---

### Case 4: Storage failure

→ stop download
→ show error

---

---

## 4.15 Performance Optimization

---

- batch API calls where possible
- avoid redundant calls
- parallelize safe modules (non-dependent)

---

---

## 4.16 Edge Cases

---

- duplicate download trigger
- status change mid-download
- large dataset
- inconsistent API response

---

---

## 4.17 Critical Rules (FINAL)

---

- ❗ Follow dependency chain strictly
- ❗ Entity + submission must exist before storing form
- ❗ submissionNumber = 1 ALWAYS
- ❗ Store incrementally
- ❗ Support retry + resume
- ❗ Preserve unsynced data
- ❗ Download must be idempotent

---
