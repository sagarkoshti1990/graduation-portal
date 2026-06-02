## <!-- SECTION 1A -->

# 📘 SECTION 1A — PROGRAM CONTEXT, OFFLINE NEED & CAPABILITY PRE-REQUISITES

---

# 1. PROGRAM CONTEXT & OFFLINE STRATEGY

---

## 1.1 Problem Context

The system is designed for **field-based operations**, where:

- Coaches interact with participants in real environments
- Internet connectivity is:

  - unavailable
  - unstable
  - unreliable

---

### Real Scenario

```text id="ctx1"
Coach visits participant → must:
- view participant details
- access project (IDP / onboarding)
- execute tasks
- fill observation forms
- upload evidence
```

👉 All workflows must work **without depending on internet**

---

## 1.2 Why Offline is Required

Without offline capability:

- Field work gets blocked
- Data capture is delayed or lost
- User productivity decreases
- Program tracking becomes inconsistent

---

### Objective of Offline

```text id="why1"
- Enable uninterrupted field operations
- Ensure reliable data capture
- Improve efficiency of coaches
- Reduce dependency on internet
```

---

## 1.3 Who Will Use Offline

---

### Primary Users — Coaches

- Execute full participant lifecycle:

  - tasks
  - observation forms
  - uploads

👉 Offline is **critical for them**

---

### Secondary Users — Coordinators

- Mostly online
- Limited offline interaction

---

Done — I’ve **inserted Dashboard Snapshot cleanly** into your existing structure without breaking flow.

👉 Updated part of **SECTION 1A** (only relevant section shown, you can replace directly):

---

## 1.4 Offline Capability Overview (IMPORTANT)

👉 Offline is **download-first**

```text id="cap_summary"
User MUST download required data before using offline features
```

---

### Capability → Download Requirement Mapping

| Capability                      | Requires Download                                            |
| ------------------------------- | ------------------------------------------------------------ |
| View Participant                | Participant details                                          |
| View Project (IDP / Onboarding) | Participant + Project                                        |
| Execute Tasks                   | Project + Task list                                          |
| Fill Observation / IDP          | Participant + Project + Tasks + Entity + Submission + Schema |
| Upload Evidence                 | No pre-download required                                     |
| Sync Data                       | Internet required                                            |

---

## 1.5 Dashboard Snapshot (Limited Offline Support)

```text id="dashboard_snapshot"
Dashboard is NOT fully supported offline.
However, snapshot-based access is supported.
```

---

### Supported

- Download dashboard as:

  - image (graph snapshot)
  - XLS / report file

- View downloaded snapshot offline (read-only)

---

### Not Supported

- Interactive dashboard
- Real-time updates
- Filters / drill-down
- Dynamic data refresh

---

## 1.6 Pre-Requisites (CRITICAL)

👉 Offline works ONLY if required data is downloaded correctly

---

### Minimum Required Data

```text id="pre_min"
participant
→ project
→ tasks
```

---

### Observation Dependency Chain

```text id="pre_obs"
participant
→ project
→ tasks
→ observation mapping
→ entityId
→ submissionId
→ schema + data
```

---

### 🚨 Important Rule

```text id="rule1"
IF entityId OR submissionId is missing
→ observation form CANNOT be opened offline
```

---

## 1.7 Example: Fill IDP Offline (MANDATORY CLARITY)

```text id="idp_example"
Coach wants to fill IDP for a participant offline
```

---

### Required Download

- participant details
- IDP project
- all project tasks
- observation mapping (solutionId)
- entityId (must exist)
- submissionId (must exist)
- full form schema + existing data

---

### Failure Condition

```text id="idp_rule"
IF any of the above is missing
→ IDP cannot be opened offline
```

---

## 1.8 What is NOT Supported Offline

---

- Login / authentication
- Entity creation
- Submission creation
- Final form submission
- Dashboards / reports
- Real-time updates
- Auto sync

---

## 1.9 Offline Model (FINAL)

---

### Model Type

```text id="model1"
Edit-Only Offline Model
```

---

### Supported

- view participant
- view project
- execute tasks
- edit observation forms
- upload files

---

### NOT Supported

- create entity offline
- create submission offline
- submit new form offline

---

## 1.10 Key Design Principles

---

- Participant-first system
- Download-first offline model
- Dependency-driven data preparation
- Manual sync control
- Data integrity over convenience

---
