# Cursor AI Codebase Review & Fix Instructions (MyApp - React Native Web)

## 🎯 PRIMARY GOALS

### 1. 🚫 Zero CodeRabbit AI Comments on PR
Cover **120+ checks** (87 checkbox items in the CodeRabbit sections below, plus 45 discrete steps in the Comprehensive Review Checklist) that CodeRabbit-style review implies—static analysis, code quality, security, performance, best practices, accessibility.

### 2. 📋 Six Custom Project Rules
1. **i18next** - All UI text uses `t()` function
2. **Constants** - No magic strings, use `@constants`
3. **Gluestack UI** - Use Gluestack components, not React Native core
4. **Platform Compatibility** - Works on Native (iOS/Android) AND Web
5. **TypeScript Strict** - No `any` types
6. **Custom API Service** - Use `@services/api`, not raw axios

### 3. 📦 Chunked Review (15 Files)
```
Review 15 files → Generate report → ⏸️ STOP & WAIT → User approves → Next 15
```
**CRITICAL:** Do NOT proceed without user approval.

------------------------------------------------------------------------

## Review Process - 15-File Chunks (MANDATORY)

### Workflow
```
Step 1: Select 15 files (by priority)
Step 2: Analyze & fix (120+ checks + 6 custom rules)
Step 3: Generate detailed report
Step 4: ⏸️ STOP & WAIT for user approval
Step 5: After approval → Next 15 files
```

### File Priority Order
1. Core services (api.ts, authenticationService.ts, offlineStorage.ts)
2. Critical screens & navigation
3. Shared components & hooks
4. Utils & constants
5. Type definitions
6. Configuration files

### Per-Chunk Report Must Include
1. **Chunk Summary** (Files reviewed/modified, issues found/fixed)
2. **File List** with status (✅ Modified, ⚠️ Needs attention, ✔️ Clean)
3. **Issues by Severity** (🔴 P0 Critical, 🟠 P1 High, 🟡 P2 Medium, 🟢 P3 Low)
4. **Detailed Changes** (Before/after code per file)
5. **Metrics** (Code quality, type safety, performance, security scores 0-10)
6. **Next Chunk Preview** (List files 16-30)
7. **⏸️ Approval Request** (STOP and WAIT - do NOT continue)

------------------------------------------------------------------------

## Six Custom Project Rules (MUST FOLLOW)

### Rule 1: i18next Translation
All UI text uses `useTranslation` hook:
```typescript
const { t } = useTranslation();
<Text>{t('common.submit')}</Text>
```

### Rule 2: Constants Usage
No magic strings - use `@constants`:
```typescript
import { STATUS } from '@constants/app.constant';
if (status === STATUS.COMPLETED) { }
```

### Rule 3: Gluestack UI First
```typescript
// ✅ Correct
<Box p="$4" bg="$white">
  <Text fontSize="$lg" fontWeight="$bold">Hello</Text>
</Box>

// ❌ Incorrect
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>
```

### Rule 4: Platform Compatibility
- Works on Native (iOS/Android) AND Web
- Use `.native.ts` and `.web.ts` for platform-specific code
- Use offlineStorage, not raw AsyncStorage

### Rule 5: TypeScript Strict
```typescript
// ✅ Correct
const handleData = (data: User) => { }

// ❌ Incorrect
const handleData = (data: any) => { }
```

**EXCEPTIONS:**
- Keep existing `@ts-ignore` comments - do NOT remove them
- Do not add any new comments.

### Rule 6: Custom API Service
```typescript
import api from '@services/api';

const fetchUser = async (id: string): Promise<User> => {
  const { t } = useTranslation();
  try {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : t('common.serverError500'));
  }
};
```

------------------------------------------------------------------------

## CodeRabbit AI Coverage (87 checkbox checks; 120+ total with Comprehensive Review Checklist)

### Static Analysis (5) - MUST CHECK ALL
- [ ] Linter errors, TypeScript errors (Run ReadLints tool)
- [ ] **Unused code, dead code** (unused imports, variables, functions)
- [ ] **Circular dependencies** (check import cycles)
- [ ] **Magic numbers** (hardcoded numbers like 500, 10, etc. - use constants)
- [ ] **TODO/FIXME comments** (scan for these and track them)

### Code Quality (7) - MUST CHECK ALL
- [ ] **Code duplication (DRY)** (repeated code blocks, extract to functions)
- [ ] **Function complexity** (cyclomatic complexity >10, simplify logic)
- [ ] **File size** (>500 lines - consider splitting)
- [ ] **Function length** (>50 lines - extract smaller functions)
- [ ] **Nested depth** (>4 levels - refactor conditionals)
- [ ] **Parameter count** (>5 params - use object parameter)
- [ ] **Code smells** (long methods, large classes, feature envy)

### TypeScript (9) - MUST CHECK ALL
- [ ] **No implicit `any`** (all types explicit, catch any type usage)
- [ ] **Interface vs Type consistency** (prefer interface for objects)
- [ ] **Optional chaining `?.`** (use for nullable properties)
- [ ] **Nullish coalescing `??`** (prefer over `||` for null/undefined)
- [ ] **Const assertions `as const`** (for literal types)
- [ ] **Generic types** (use for reusable components/functions)
- [ ] **Type guards** (use for runtime type checking)
- [ ] **Prefer union types over enums** (unless specific need)
- [ ] **Strict mode enabled** (verify tsconfig.json)

### React/React Native (10) - MUST CHECK ALL
- [ ] **Hooks rules** (no conditionals/loops, must be at top level)
- [ ] **Dependency arrays correct** (useEffect/useCallback/useMemo deps complete)
- [ ] **Proper keys in lists** (no index keys, use unique IDs)
- [ ] **Props validation** (TypeScript interfaces for all props)
- [ ] **Avoid redundant state** (derive from props/other state when possible)
- [ ] **useEffect cleanup** (return cleanup function for subscriptions/timers)
- [ ] **Memoization** (React.memo for expensive components, useMemo for calculations)
- [ ] **useCallback for event handlers** (prevent child re-renders)
- [ ] **No inline conditionals with side effects** (extract to useEffect)
- [ ] **Use fragments** vs unnecessary divs/Views

### Performance (8) - MUST CHECK ALL
- [ ] **No unnecessary re-renders** (use React DevTools Profiler mentally check)
- [ ] **No heavy computations in render** (move to useMemo or outside component)
- [ ] **Bundle size optimization** (check import sizes, tree-shaking)
- [ ] **Memory leaks** (cleanup listeners, timers, subscriptions in unmount)
- [ ] **Infinite loops** (useEffect without proper deps or termination)
- [ ] **Image optimization** (proper size, lazy loading, caching)
- [ ] **List virtualization** (FlatList for long lists, not ScrollView+map)
- [ ] **Lazy loading / code splitting** (React.lazy for large components)

### Security (9) - MUST CHECK ALL
- [ ] **No exposed secrets/API keys** (scan for hardcoded keys, tokens, passwords)
- [ ] **No XSS vulnerabilities** (sanitize user input, dangerouslySetInnerHTML)
- [ ] **No SQL injection** (parameterized queries, ORM usage)
- [ ] **Auth checks present** (protected routes, permission checks)
- [ ] **CSRF protection** (for web, check token usage)
- [ ] **Input validation** (validate all user inputs, forms)
- [ ] **No dependency vulnerabilities** (check package.json for CVEs)
- [ ] **Secure storage** (no plaintext sensitive data, use encrypted storage)
- [ ] **No sensitive data in console logs** (PII, tokens, passwords)

### CodeRabbit-style alignment (apply when fixing PR feedback)
- [ ] **API error message**: Normalize `data.message` before throwing (check `typeof rawMessage === 'string' && rawMessage.trim() !== ''`; fallback to status text).
- [ ] **Storage fallbacks**: Guard `localStorage` / `process` before use (e.g. `typeof window !== 'undefined' && window.localStorage`, `process?.env?.API_BASE_URL`).
- [ ] **useEffect deps**: Do not include `error` (or other state set inside the effect) in dependency arrays when it would cause re-run loops.
- [ ] **Required validators**: Treat only `null`/`undefined`/blank string as empty; allow valid falsy values like `0` and `false`.
- [ ] **ApiResponse shape**: Service functions that return `ApiResponse<T>` must return `{ data }` on success and matching shape on error (e.g. `handleApiError`).
- [ ] **Presigned URL / optional lookup**: Fail fast with a clear error if a required value (e.g. presigned URL for a file) is missing before calling `fetch` or similar.

### Error Handling (7) - MUST CHECK ALL
- [ ] **Try-catch blocks for async** (all async/await wrapped in try-catch)
- [ ] **React error boundaries** (ErrorBoundary components for fallbacks)
- [ ] **Handled promise rejections** (all .then() have .catch())
- [ ] **API error handling** (proper error messages, status codes)
- [ ] **User-friendly error messages** (use i18next for errors)
- [ ] **Fallback UI** (loading states, error states, empty states)
- [ ] **Error logging** (use logger.error, not console.error)

### Testing (6) - CHECK BUT DON'T FIX (INFO ONLY)
- [ ] **Critical functions have tests** (note missing tests, don't create them)
- [ ] **Components are testable** (check structure allows testing)
- [ ] **API integrations tested** (check if testable)
- [ ] **Edge cases handled** (null, undefined, empty arrays)
- [ ] **Dependencies mockable** (check for tight coupling)
- [ ] **>80% coverage on critical paths** (aspirational, note gaps)

### Accessibility (8) - MUST CHECK ALL
- [ ] **Semantic elements** (web: proper HTML tags, not all divs)
- [ ] **accessibilityLabel** on interactive elements (buttons, touchables)
- [ ] **accessibilityRole** for screen readers (button, link, header, etc.)
- [ ] **Keyboard navigation** (web: tab order, enter/space for actions)
- [ ] **Focus management** (focus visible, focus trap in modals)
- [ ] **Color contrast** (WCAG AA 4.5:1 for text, 3:1 for UI components)
- [ ] **Screen reader compatible** (test with VoiceOver/TalkBack)
- [ ] **Touch target size** (44x44 points minimum for tappable areas)

### Documentation (5) - SELECTIVE (See Exceptions)
- [ ] **JSDoc for complex functions** (only complex logic, not constants)
- [ ] **Type definitions documented** (complex types need explanation)
- [ ] **README updates** (if adding new features/patterns)
- [ ] **Non-obvious logic explained** (why, not what)
- [ ] **Breaking changes in CHANGELOG** (if applicable)

**EXCEPTIONS:**
- Do NOT add JSDoc comments to constant files (e.g., `app.constant.ts`)
- Do NOT add inline comments explaining constant values
- Keep existing comments format and structure

### Git (5) - MUST CHECK ALL
- [ ] **Clear commit messages** (conventional commits: feat/fix/chore)
- [ ] **Atomic commits** (one logical change per commit)
- [ ] **Branch naming convention** (feature/, bugfix/, hotfix/)
- [ ] **No debug code** (no `debugger` statements, debug console.logs)
- [ ] **No commented code** (remove commented blocks, keep only explanatory comments)

### Project-Specific (8) - MUST CHECK ALL
- [ ] **Gluestack UI** (not RN core - use Box/Text/Button from @ui)
- [ ] **i18next** (all text uses `t()` - no hardcoded strings)
- [ ] **Constants** (no magic strings - use @constants imports)
- [ ] **API service** (@services/api - no raw axios imports)
- [ ] **Path aliases** (@components, @hooks, @utils, @services, @constants)
- [ ] **Platform compatibility** (native + web - test both, use .native/.web)
- [ ] **offlineStorage service** (not raw AsyncStorage/localStorage)
- [ ] **Logger** (@utils/logger vs console.log - replace ALL console usage)

**EXCEPTIONS:**
- Do NOT change `logger.log()` to `logger.info()` in existing code
- Keep existing logger method calls as-is

------------------------------------------------------------------------

## 🚫 CRITICAL EXCEPTIONS (DO NOT CHANGE)

### 1. `@ts-ignore` Comments
- **DO NOT** remove `@ts-ignore` comments
- Keep all type suppression directives unchanged

### 2. JSDoc Comments
- **DO NOT** add JSDoc comments to constant definition files
- **DO NOT** add inline comments to constant values
- Only add JSDoc to complex functions and utilities

### 3. Logger Methods
- **DO NOT** change `logger.log()` to `logger.info()`
- Keep existing logger method calls unchanged

------------------------------------------------------------------------

## Output Requirements (Per Chunk)

### 1. Chunk Summary
```
📦 Chunk #X Complete | Files: 15 | Modified: X | Issues: X Fixed
```

### 2. File Status
```
✅ src/services/api.ts - Modified (3 issues)
⚠️ src/utils/helpers.ts - Needs attention (2 issues)
✔️ src/constants/app.constant.ts - Clean
```

### 3. Issues by Severity
```
🔴 P0: [Security] Exposed API key (file X, line Y)
🟠 P1: [Performance] Unnecessary re-renders (component Z)
🟡 P2: [Quality] Unused imports (5 files)
🟢 P3: [Style] Inconsistent naming
```

### 4. Detailed Changes
```markdown
### File: src/components/MyComponent.tsx

Issues: ❌ Missing types | ❌ Hardcoded text | ❌ Unused import
Fixes: ✅ Added interface | ✅ Used t() | ✅ Removed import

**Before:**
[code snippet]

**After:**
[code snippet]
```

### 5. Metrics
```
Code Quality: X/10 | Type Safety: X/10
Performance: X/10 | Security: X/10
```

### 6. Next Chunk Preview
```
Files 16-30:
1. src/screens/Dashboard/index.tsx
2. [... 14 more files]
```

### 7. ⏸️ APPROVAL REQUEST
```
╔═══════════════════════════════════════╗
║   🛑 WAITING FOR USER APPROVAL 🛑    ║
║                                       ║
║  Reply: "APPROVED" to continue       ║
║         "STOP" to halt               ║
╚═══════════════════════════════════════╝
```

------------------------------------------------------------------------

## 📋 COMPREHENSIVE REVIEW CHECKLIST (Use This for Every Chunk)

### 🔍 Step 1: Static Analysis (CRITICAL)
1. Run `ReadLints` tool on all files in chunk
2. Search for `console.log` and `console.error` → Replace with `logger`
3. Search for unused imports (import statements never referenced)
4. Search for hardcoded numbers (magic numbers) → Use constants
5. Search for `TODO`, `FIXME`, `HACK`, `XXX` comments → Document them

### 🎯 Step 2: Code Quality (HIGH PRIORITY)
1. **File Size**: If >500 lines, note for potential splitting
2. **Function Length**: If >50 lines, consider refactoring
3. **Duplicate Code**: Look for repeated patterns (>3 lines repeated 2+ times)
4. **Deep Nesting**: If >4 levels deep, refactor conditionals
5. **Many Parameters**: If function has >5 params, use object parameter

### 🔧 Step 3: TypeScript (CRITICAL)
1. Search for `: any` type → Fix with proper types
2. Check for `?.` optional chaining where needed (nullable access)
3. Check for `??` nullish coalescing vs `||` (prefer `??`)
4. Verify all interfaces/types are properly defined
5. No implicit any in function parameters

### ⚛️ Step 4: React/React Native (HIGH PRIORITY)
1. **useEffect deps**: Check ALL useEffect arrays are complete
2. **Keys in lists**: Check `.map()` has proper key (not index)
3. **Event handlers**: Check if useCallback is needed (passed to children)
4. **Heavy calculations**: Move to useMemo if in render
5. **Cleanup**: Check useEffect returns cleanup for timers/subscriptions

### ⚡ Step 5: Performance (MEDIUM PRIORITY)
1. **Lists**: If ScrollView + .map() > 20 items, suggest FlatList
2. **Heavy computations**: Check for expensive operations in render
3. **Re-renders**: Look for missing React.memo on expensive components
4. **Memory leaks**: Check for uncleaned timers, listeners, subscriptions

### 🔒 Step 6: Security (CRITICAL)
1. Search for hardcoded: `apiKey`, `secret`, `password`, `token`, `key:`
2. Check user inputs are validated (forms, text inputs)
3. Check sensitive data not in console logs (passwords, tokens, PII)
4. Verify secure storage usage (offlineStorage, not plain AsyncStorage)

### ♿ Step 7: Accessibility (MEDIUM PRIORITY)
1. Check Pressable/TouchableOpacity has `accessibilityLabel`
2. Check `accessibilityRole` on interactive elements
3. Check button/touchable min size (should feel 44x44 dp)
4. Note color contrast issues (light text on light bg)

### 📝 Step 8: Project Rules (CRITICAL)
1. **i18next**: Search for `<Text>` without `{t(` → Fix
2. **Gluestack UI**: Search for `<View`, `<TextInput` → Use Box, Input
3. **Constants**: Look for strings like `'success'`, `'pending'` → Use constants
4. **API Service**: Check `import axios` → Should use `@services/api`
5. **Logger**: Already checked in Step 1

### 🚫 Step 9: Debug Code (CRITICAL)
1. Search for `debugger` statements → Remove
2. Search for large commented code blocks → Remove
3. Check for development-only logs left in code

### ✅ Step 10: Generate Report
1. List all files with status (Clean / Fixed / Needs Attention)
2. Document all changes made (before/after)
3. List issues by severity (P0/P1/P2/P3)
4. Calculate metrics (0-10 scores)
5. **DO NOT create separate .md report file** - include in response

------------------------------------------------------------------------

**Remember:**
1. **15-file chunks** with approval gates
2. **120+ checks** for zero CodeRabbit comments (use comprehensive checklist above)
3. **6 custom rules** enforced (i18next, constants, Gluestack, platform, TypeScript, API service)
4. **Quality over speed** - thorough review, fix what matters
5. **Don't generate separate report file** - include detailed report in response text
