## <!-- SECTION 3 -->

# 📘 SECTION 3 — CAPABILITIES, DOWNLOAD OPTIONS & STATUS-BASED BEHAVIOR

---

# 3. CAPABILITY CONTROL & DOWNLOAD CONFIGURATION

---

## 3.1 Purpose

This section defines:

- How capabilities are **enabled/disabled**
- How **download options are generated**
- How behavior changes based on **participant status**
- How system ensures **only valid offline data is prepared**

---

## 3.2 Core Concept

Offline is **NOT full data download**

👉 It is **controlled, selective download**

```text id="c9f1z2"
User selects WHAT to download
System validates WHAT is allowed
System downloads ONLY valid modules
```

---

## 3.3 Download Trigger Flow

---

### Step 1: User Action

```text id="2lq9ha"
User clicks → "Download Offline"
```

---

### Step 2: System Call

```text id="n2f7wd"
getDownloadOptions(participantStatus)
```

---

### Step 3: Modal Display

- Show selectable options
- Hide invalid options
- Pre-select recommended items

---

### Step 4: User Selection

- User selects modules
- Selection stored in `downloadConfig`

---

### Step 5: Start Download

- Execute pipeline based on selected modules

---

## 3.4 downloadConfig (FINAL STRUCTURE)

```json id="0fwc3x"
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

---

## 3.5 Participant Status Mapping (CRITICAL)

System behavior depends on **participant status**

---

### Supported Statuses

```text id="n8n4n0"
NOT_ONBOARDED
IN_PROGRESS
COMPLETED
```

---

## 3.6 getDownloadOptions (FINAL MAPPING)

---

### 3.6.1 NOT ONBOARDED

---

#### Available Modules

- Participant Info
- Onboarding Project
- Observation Log Visit
- Household Profile

---

#### Hidden Modules

- Individual Visit
- Midline
- Intervention Plan
- Endline

---

---

### 3.6.2 IN PROGRESS

---

#### Available Modules

- Participant Info
- IDP Project
- Observation Log Visit
- Individual Visit
- Midline Survey

---

#### Hidden Modules

- Household Profile
- Intervention Plan
- Endline

---

---

### 3.6.3 COMPLETED

---

#### Available Modules

- Participant Info
- IDP Project (read-only)
- Individual Visit
- Midline Survey
- Intervention Plan
- Endline Survey

---

#### Behavior

- Forms may be read-only (based on business rules)

---

---

## 3.7 Observation Option Mapping (DETAILED)

---

Each observation option corresponds to:

```text id="fw2czx"
project.tasks[]
  → filter(type = "observation")
  → map solutionDetails.observationId
```

---

### Final Mapping

| Option            | Source        |
| ----------------- | ------------- |
| Log Visit         | observationId |
| Household Profile | project task  |
| Individual Visit  | observationId |
| Midline           | observationId |
| Intervention Plan | observationId |
| Endline           | observationId |

---

## 3.8 Download Execution Based on Config

---

### Flow

```text id="2tgmf7"
downloadConfig
   → filter modules
   → execute APIs per module
   → store results
```

---

### Example

If user selects:

```json id="o4ew6u"
{
  "participant": true,
  "project": true,
  "observation": {
    "logVisit": true
  }
}
```

System will:

- fetch participant
- fetch project + tasks
- fetch ONLY log visit observation

---

## 3.9 Validation Before Download

---

### Mandatory Checks

- participant exists
- project exists
- valid status

---

### Observation Validation

```text id="p3mlnm"
IF observation selected:
   → ensure entity
   → ensure submission
```

---

### Failure Case

- If entity/submission cannot be created:
  → skip module
  → log error

---

## 3.10 Partial Download Support

---

### Scenario

- Some modules succeed
- Some fail

---

### Behavior

- Save successful modules
- Mark failed modules
- Allow retry

---

## 3.11 UI Behavior

---

### During Selection

- Disable invalid options
- Show tooltip if not allowed

---

### During Download

- Progress indicator
- Module-wise status

---

### After Download

- Show:

  - success
  - partial success
  - failure

---

## 3.12 Re-download Behavior

---

### Scenario

User downloads again

---

### System Must:

- detect existing data
- compare timestamps
- update only necessary modules
- preserve unsynced edits

---

## 3.13 Edge Cases

---

### Case 1: User selects invalid option

→ prevent selection

---

### Case 2: Status changes during download

→ validate again
→ adjust modules

---

### Case 3: Observation without submission

→ create submission before storing

---

### Case 4: Large dataset

→ batch download

---

## 3.14 Critical Rules (FINAL)

---

- ❗ Download is **selective, not full dump**
- ❗ Options depend on **participant status**
- ❗ Observation download must ensure entity + submission
- ❗ downloadConfig drives execution
- ❗ Partial download must be supported
- ❗ Re-download must be safe (no data loss)

---
