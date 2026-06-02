# Offline Service Architecture

> **Status:** Active | **Date:** 2026-05-14 | **Scope:** `src/services/` · `src/project-player/services/`

---

## 1. Problem Statement

Service functions were calling APIs directly and returning raw responses with no offline awareness:

```typescript
// BEFORE — bypasses offline storage entirely
return response.data;   // fails when network is unavailable
```

This caused failures when the device was offline, even for data that had been previously downloaded.

---

## 2. Design Goals

| Goal | Detail |
|------|--------|
| Offline-first | Return cached data first; refresh in background when online |
| Standardized response | Every service response carries `isOffline`, `offlineSupported`, `offlineDataAvailable` flags |
| Configuration-driven | Which APIs support offline is declared in `STORAGE_KEYS.ts`, not scattered in service files |
| Single responsibility | All offline logic lives in the service layer; components only inspect response flags |
| No localStorage | All offline business data goes to IndexedDB via the existing `offlineStorage` service |
| Reusable utility | One `withOfflineFirst()` function handles every API, no duplicate logic |

---

## 3. Architecture Overview

```
Component / Hook
      │
      ▼
  dataService.ts          ← ONLY layer components call
      │
      ├── withOfflineFirst()   ← reusable offline-first utility (offlineFirst.ts)
      │         │
      │         ├── OFFLINE_API_CONFIG (STORAGE_KEYS.ts)  ← config: supported? cache key?
      │         │
      │         ├── offlineStorage  (IndexedDB on web, AsyncStorage on native)
      │         │
      │         └── API call (participantService / solutionService / etc.)
      │
      └── returns OfflineServiceResponse<T>   ← standardized, always
```

---

## 4. Standardized Response Type

**File:** `src/services/offlineTypes.ts`

```typescript
interface OfflineServiceResponse<T> {
  data: T;                        // actual result (empty value when unavailable)
  isOffline: boolean;             // device is currently offline
  offlineSupported: boolean;      // this API has offline data support configured
  offlineDataAvailable: boolean;  // cached data exists and was returned
  message?: string;               // i18n key when data unavailable
  fromCache?: boolean;            // true when data came from IndexedDB (not API)
}
```

### Response scenarios

| Scenario | isOffline | offlineSupported | offlineDataAvailable | data |
|----------|-----------|-----------------|----------------------|------|
| Online, API success | false | true/false | true (if supported) | live API data |
| Online, API error, cache hit | false | true | true | cached data |
| Online, API error, no cache | false | true | false | empty |
| Offline, cache hit | true | true | true | cached data |
| Offline, no cache | true | true | false | empty |
| Offline, API not supported | true | false | false | empty |

### Component usage pattern

```typescript
// In a component/hook — ONLY check flags, no offline logic
const response = await dataService.getSolutions({ type: 'observation' });

if (!response.offlineDataAvailable && response.isOffline) {
  // Show OfflineUnavailable component
  return;
}

const solutions = response.data; // AssessmentSurveyCardData[]
```

---

## 5. `withOfflineFirst()` Utility

**File:** `src/services/offlineFirst.ts`

Core utility used by every service function. Takes an API call + config and returns `OfflineServiceResponse<T>`.

### Offline-first flow

```
withOfflineFirst(apiCall, config)
  │
  ├── Device OFFLINE?
  │     ├── config.offlineSupported = false → return empty + flags (no API call)
  │     ├── config.offlineSupported = true
  │     │     ├── cache hit → return cached data + flags
  │     │     └── no cache  → return empty + flags
  │     └─────────────────────────────────────────────
  │
  └── Device ONLINE
        ├── call API
        │     ├── success → cache result (background) → return data + flags
        │     └── error   → try cache fallback
        │                   ├── cache hit → return cached + flags
        │                   └── no cache  → throw error (let caller handle)
        └──────────────────────────────────────────────
```

### Config interface

```typescript
interface OfflineFirstConfig<T> {
  offlineSupported: boolean;     // from OFFLINE_API_CONFIG
  cacheKey?: string;             // static key (e.g. 'participants:projectCategories')
  cacheReader?: () => Promise<T | null>;  // dynamic key (e.g. participant:id:project)
  cacheWriter?: (data: T) => Promise<void>;
  emptyValue: T;                 // [] for lists, {} or null for objects
}
```

---

## 6. Offline API Configuration

**File:** `src/constants/STORAGE_KEYS.ts` → `OFFLINE_API_CONFIG`

Declares which service functions support offline and what their cache key is.

```typescript
export const OFFLINE_API_CONFIG = {
  PARTICIPANTS_LIST:    { supported: true,  cacheKey: () => OFFLINE_KEYS.PARTICIPANTS_LIST },
  PARTICIPANT_DETAILS:  { supported: true,  cacheKey: (id: string) => PARTICIPANT_KEYS.details(id) },
  PROJECT:              { supported: true,  cacheKey: (id: string) => PARTICIPANT_KEYS.project(id) },
  OBSERVATION_FORM:     { supported: true,  cacheKey: (pid: string, fid: string) => PARTICIPANT_KEYS.form(pid, fid) },
  TARGETED_SOLUTIONS:   { supported: true,  cacheKey: (type: string) => `participants:solutions:${type}` },
  PROJECT_CATEGORIES:   { supported: true,  cacheKey: () => 'participants:projectCategories' },
  // Write operations and admin APIs — NOT offline-supported
  USER_MANAGEMENT:      { supported: false },
  OBSERVATION_ENTITIES: { supported: false },
  ENTITY_TYPES:         { supported: false },
};
```

Adding offline support to a new API requires only:
1. Adding an entry here with `supported: true` and a `cacheKey`
2. Calling `withOfflineFirst(apiCall, { offlineSupported: config.supported, cacheKey: ... })`

---

## 7. Service Layer Responsibilities

### `dataService.ts` — THE consumer-facing layer

All reads go through `withOfflineFirst`. Returns `OfflineServiceResponse<T>`.

| Function | Offline key | Empty value |
|----------|------------|-------------|
| `getParticipantList(params)` | `participants:list:{status}` | `{ participants: [], total: 0, overview: null }` |
| `getParticipantDetails(id, userId)` | `participant:{id}:details` → `listSnapshot` | `null` |
| `getProject(participantId, projectId?)` | `participant:{id}:project` | `null` |
| `getTasks(participantId)` | extracted from project | `[]` |
| `getObservationForm(participantId, formId)` | `participant:{id}:form:{formId}` | `null` |
| `getSolutions(params)` | `participants:solutions:{type}` | `[]` |
| `getProjectCategories()` | `participants:projectCategories` | `[]` |
| `getEntityDetails(participantId)` | `participant:{id}:details` | `null` |

### Write operations in `dataService.ts`

Write operations (`saveTaskEdit`, `saveFormEdits`, `updateTask`) do NOT go through `withOfflineFirst`. Instead:
- If offline → persist locally only (for sync later)
- If online → call API + dequeue local

---

## 8. IndexedDB Routing

`offlineStorage.ts` automatically routes to IndexedDB on web for keys with these prefixes:
- `participant:*` — all per-participant data
- `participants:*` — registry, list cache, solutions cache
- `sync:*` — sync failure log, timestamps

All other keys (auth tokens, settings) use AsyncStorage → localStorage on web.

---

## 9. Component Integration (Offline Unavailable UI)

Components should check response flags only — no custom offline detection:

```typescript
// Pattern for offline-unsupported pages
const response = await dataService.getSomeData();

if (response.isOffline && !response.offlineSupported) {
  return <OfflineUnavailable />;  // "This page is not available offline"
}

if (response.isOffline && !response.offlineDataAvailable) {
  return <OfflineUnavailable cached={false} />;  // "Offline data not available"
}

// Use response.data normally
```

The `OfflineUnavailable` component is a shared UI component in `src/components/OfflineUnavailable/`.

---

## 10. Migration Notes

### Before (old pattern)
```typescript
const result = await dataService.getParticipantList(params);
setParticipants(result.participants); // direct access
if (isOfflineFallback(result)) { ... } // sentinel check
```

### After (new pattern)
```typescript
const response = await dataService.getParticipantList(params);
if (response.isOffline && !response.offlineDataAvailable) {
  // show offline unavailable UI
  return;
}
setParticipants(response.data.participants); // access through .data
```

- `isOfflineFallback()` → replaced by `response.isOffline && !response.offlineDataAvailable`
- `result.X` → `response.data.X`
- The `fromCache` flag on `ParticipantListResult` is preserved inside `response.data`

---

## 11. Files Changed

| File | Change |
|------|--------|
| `src/services/offlineTypes.ts` | **NEW** — OfflineServiceResponse<T> type + builder helpers |
| `src/services/offlineFirst.ts` | **NEW** — withOfflineFirst() utility |
| `src/constants/STORAGE_KEYS.ts` | **UPDATED** — OFFLINE_API_CONFIG added |
| `src/services/dataService.ts` | **UPDATED** — all functions use withOfflineFirst, return OfflineServiceResponse<T> |
| `src/components/OfflineUnavailable/index.tsx` | **NEW** — shared offline unavailable UI component |

---

## 12. What Screens Need (Follow-up Task)

Screen components that currently use `result.participants` pattern need to change to `result.data.participants`. This is a **follow-up task** and is NOT part of this implementation. The service layer is complete; screen adaptation is minimal and mechanical.
