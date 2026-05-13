## <!-- SECTION 6 -->

# 📘 SECTION 6 — STORAGE ARCHITECTURE

---

# 6. STORAGE ARCHITECTURE (OFFLINE-FIRST, CROSS-PLATFORM)

---

## 6.1 Purpose

The Storage Architecture is responsible for:

- Persisting all offline data
- Supporting **participant-centric data isolation**
- Acting as the **single source of truth via offlineService**
- Bridging Web (IndexedDB) and Native storage
- Enabling safe **download → usage → sync lifecycle**

---

## 6.2 Core Principle

```text id="c5x1n2"
offlineService = SINGLE SOURCE OF TRUTH
```

---

### Important Clarification

```text id="m7y9a1"
IndexedDB (Web Component) is NOT authoritative
```

👉 It is only:

- temporary
- UI-driven
- must sync into offlineService

---

## 6.3 Storage Layers

---

## 6.3.1 React Native

---

### Storage Types

| Storage             | Usage     |
| ------------------- | --------- |
| MMKV / AsyncStorage | JSON data |
| react-native-fs     | files     |

---

### Responsibilities

- store participant/project/task data
- store observation (entity + submission + schema + data)
- store file paths
- store sync queue

---

---

## 6.3.2 Web

---

### Storage Types

| Storage      | Usage        |
| ------------ | ------------ |
| IndexedDB    | JSON + blobs |
| LocalStorage | flags        |

---

### Special Case

Web component also uses IndexedDB internally

👉 BUT:

```text id="v9d2e7"
offlineService must maintain its own namespace
```

---

## 6.4 Data Segmentation (VERY IMPORTANT)

---

### Primary Key Strategy

```text id="d3z5k8"
ALL data is scoped by participantId
```

---

### Structure

```text id="x4l7p1"
participant:{id}:*
```

---

### Benefits

- easy cleanup
- isolation
- safe sync
- scalable

---

## 6.5 Storage Schema (FINAL)

---

## 6.5.1 Global Keys

```text id="f2s6v3"
participants:list
participants:offline:ids

storage:version
storage:limit
```

---

## 6.5.2 Participant Core

```text id="h7m3r9"
participant:{id}:details
participant:{id}:status
participant:{id}:lastSyncedAt
participant:{id}:downloadStatus
```

---

## 6.5.3 Project & Tasks

```text id="t8c5y2"
participant:{id}:project
participant:{id}:tasks

participant:{id}:project:edits
participant:{id}:project:syncStatus
```

---

## 6.5.4 Observation Forms (CRITICAL)

---

### Base Data

```text id="k1b6n4"
participant:{id}:form:{formId}
```

---

### Structure

```json id="v4m9c2"
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

---

### Edits

```text id="p3d9x8"
participant:{id}:form:{formId}:edits
```

---

### Sync Status

```text id="s6q1z7"
participant:{id}:form:{formId}:syncStatus
```

---

## 6.5.5 File Storage

```text id="b7e4k1"
participant:{id}:files:{fileId}
participant:{id}:files:pending
participant:{id}:files:synced
```

---

## 6.5.6 LMS (Future / Optional)

```text id="j5t2w6"
lms:{moduleId}:video:path
lms:{moduleId}:pdf:path

lms:{moduleId}:video:progress
lms:{moduleId}:pdf:progress
```

---

## 6.5.7 Sync Queue

```text id="q9u7a3"
sync:queue
sync:failed
sync:lastRun
```

---

## 6.6 Data Lifecycle

---

## 6.6.1 Download Phase

```text id="r4n2o9"
API → transform → store via offlineService
```

---

## 6.6.2 Usage Phase

```text id="x7m1e6"
UI reads from offlineService
Web component edits → IndexedDB → bridge → offlineService
```

---

## 6.6.3 Sync Phase

```text id="z5c3v2"
read edits → push to server → merge → clear edits
```

---

## 6.6.4 Cleanup Phase

```text id="g6h9p4"
remove participant data
free storage
```

---

## 6.7 IndexedDB Synchronization (CRITICAL)

---

## Problem

- Web component writes to IndexedDB
- Native does not automatically receive updates

---

## Solution

---

### On Form Open

```text id="w1e3r5"
sync IndexedDB → offlineService
```

---

### During Edit

```text id="y8u2i4"
postMessage → offlineService update
```

---

### Rule

```text id="n2k4l6"
offlineService MUST always be latest
```

---

## 6.8 Storage Limits & Management

---

## 6.8.1 Limit Tracking

- total storage usage
- per participant size

---

## 6.8.2 Behavior When Full

```text id="c8p2m7"
block download
show error
suggest cleanup
```

---

## 6.8.3 Strategy

- LRU cleanup (optional)
- manual delete

---

## 6.9 Data Expiry

---

### Structure

```json id="o3v8w2"
{
  "expiresAt": "timestamp"
}
```

---

### Behavior

- expired → restrict usage
- prompt re-download

---

## 6.10 Versioning

---

### Global

```text id="l9b4c6"
storage:version
```

---

### Rule

```text id="k7d5f2"
version mismatch → invalidate data
```

---

### Entity-Level

```json id="t6s8a3"
{
  "version": "v1",
  "updatedAt": "timestamp"
}
```

---

## 6.11 Data Validation

---

Before use:

- schema exists
- entityId exists
- submissionId exists
- version matches

---

## 6.12 Failure Handling

---

### Case 1: Write failure

→ stop operation

---

### Case 2: Corrupted data

→ discard → re-download

---

### Case 3: Partial data

→ render available modules
→ disable others

---

## 6.13 Performance Optimization

---

- batch writes
- lazy load large data
- avoid large in-memory objects

---

## 6.14 Security Considerations

---

- validate data before sync
- restrict file types
- avoid storing sensitive data if required

---

## 6.15 Critical Rules (FINAL)

---

- ❗ offlineService is ONLY source of truth
- ❗ IndexedDB is temporary
- ❗ Data must be participant-scoped
- ❗ entityId + submissionId required for forms
- ❗ Always sync IndexedDB → offlineService
- ❗ Always validate before render

---
