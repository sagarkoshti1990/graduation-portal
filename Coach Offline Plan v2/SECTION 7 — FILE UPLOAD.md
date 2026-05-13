## <!-- SECTION 7 -->

# 📘 SECTION 7 — FILE UPLOAD

---

# 7. FILE UPLOAD (OFFLINE-FIRST, TASK-INTEGRATED, SYNC-DEPENDENT)

---

## 7.1 Purpose

The File Upload module handles:

- Capturing files for **upload tasks** and **observation forms**
- Storing files locally (offline-first)
- Linking files to **tasks/forms (submission data)**
- Uploading files during sync
- Replacing local references with **server URLs**

---

## 7.2 Role in LC Flow

```text id="4m8k2p"
Participant
  → Project
    → Tasks
      → Upload Task / Observation Task
        → File Upload
```

👉 File upload is **not standalone**
👉 It is always linked to:

- task
- observation submission

---

## 7.3 Core Constraints

---

### System Rules

- Files are always tied to:

  ```text
  submissionId (for observation)
  OR taskId (for upload task)
  ```

---

### Offline Behavior

| Capability         | Supported |
| ------------------ | --------- |
| Select file        | ✅        |
| Store locally      | ✅        |
| Link to form/task  | ✅        |
| Upload immediately | ❌        |
| Sync later         | ✅        |

---

## 7.4 File Sources

---

### 1. Upload Tasks

- File required to complete task

---

### 2. Observation Forms

- Evidence fields (e.g. BigPush, attachments)

---

## 7.5 Platform Storage Strategy

---

## 7.5.1 React Native

---

### Library

- `react-native-fs`

---

### Flow

```text id="x1c9v2"
User selects file
 → store in device storage
 → generate fileId
 → store path in offlineService
```

---

### Example

```json id="w3q6k8"
{
  "fileId": "uuid",
  "localPath": "/storage/app/file.jpg",
  "fileType": "image",
  "linkedTo": {
    "participantId": "string",
    "formId": "string"
  },
  "syncStatus": "pending"
}
```

---

## 7.5.2 Web (Web Component)

---

### Storage

- IndexedDB (base64 / blob)

---

### Flow

```text id="t2n7y5"
User selects file
 → convert to base64/blob
 → store in IndexedDB
 → generate base64Key
 → attach key to form schema
```

---

### Example

```json id="z9l2c7"
{
  "fileId": "uuid",
  "base64Key": "idb_file_123",
  "fileType": "image",
  "syncStatus": "pending"
}
```

---

## 7.6 Bridge Integration (WEB → NATIVE)

---

### Problem

- Web stores file in IndexedDB
- Native does NOT know about it

---

### Solution (MANDATORY)

Web must emit:

```js id="e3u7p1"
window.postMessage({
  type: "FILE_UPLOADED",
  payload: {
    fileId,
    base64Key,
    formId,
  },
});
```

---

### Native Handling

```js id="y4d8m6"
offlineService.storeFile({
  fileId,
  base64Key,
  formId,
  syncStatus: "pending",
});
```

---

## 7.7 Storage Schema

```text id="b2v5k1"
participant:{id}:files:{fileId}
participant:{id}:files:pending
participant:{id}:files:synced
```

---

## 7.8 Linking Files to Tasks/Forms

---

### Observation Form Example

```json id="p6x3z2"
{
  "fieldId": "upload_proof",
  "value": {
    "fileId": "uuid",
    "localRef": "path/base64Key",
    "syncStatus": "pending"
  }
}
```

---

### Upload Task Example

```json id="k8q9n4"
{
  "taskId": "string",
  "fileId": "uuid",
  "localRef": "...",
  "status": "pending"
}
```

---

## 7.9 Sync Flow (CRITICAL)

---

### Execution Order

```text id="m7r1t5"
FILES → OBSERVATION → TASK/PROJECT
```

---

### Step-by-Step

```text id="a5w8u3"
1. Get pending files
2. Upload file to server
3. Receive file URL / ID
4. Update form/task JSON
5. Mark file as synced
```

---

## 7.10 Sync Payload

```json id="h4k2p9"
{
  "fileId": "uuid",
  "file": "<binary/base64>",
  "linkedTo": {
    "participantId": "string",
    "submissionId": "string"
  }
}
```

---

## 7.11 Post Upload Update

---

### Replace Local Reference

```text id="c9v2m6"
localRef → serverUrl
```

---

### Update Form Data

- Replace base64Key/path with server URL
- Then sync form

---

## 7.12 Failure Handling

---

### Case 1: Upload Failed

- keep file in pending
- retry later

---

### Case 2: Partial Upload

- retry only failed files

---

### Case 3: Missing File

- block sync
- show error

---

### Case 4: Corrupted File

- discard
- ask re-upload

---

## 7.13 Conflict Handling

---

### Scenario

Same field updated on multiple devices

---

### Strategy

```text id="p4n7q1"
last-write-wins (updatedAt)
```

---

## 7.14 Storage Limits Impact

---

### Risk

- files consume maximum storage

---

### Rules

- validate size before saving
- restrict large files
- notify user

---

## 7.15 Cleanup Strategy

---

### After Sync

- optional:

  - remove local file
  - OR keep cached

---

### Manual Cleanup

- delete participant → delete all files

---

## 7.16 Performance Optimization

---

- compress images before storing
- avoid large base64 where possible
- batch uploads

---

## 7.17 Edge Cases

---

- app killed during upload
- network drop mid-upload
- duplicate file selection
- file linked but not uploaded

---

## 7.18 Security Considerations

---

- validate file type
- restrict size
- prevent unsafe files

---

## 7.19 Critical Rules (FINAL)

---

- ❗ File must be stored locally first
- ❗ File must be linked to task/form
- ❗ Files must upload BEFORE form sync
- ❗ offlineService manages file state
- ❗ IndexedDB/native FS is NOT final truth
- ❗ Always replace localRef with server URL

---
