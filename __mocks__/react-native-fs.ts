/**
 * Manual Jest mock for `react-native-fs`.
 *
 * Placed at the project root (not under src/) because Jest only
 * auto-applies manual mocks for node_modules packages when the mock file
 * lives in a `__mocks__` directory adjacent to `node_modules` — this is a
 * Jest resolution requirement, not an architectural choice, so it can't be
 * co-located with the rest of the SmartStorage module.
 *
 * Implements an in-memory virtual filesystem exercising the same surface
 * FileStorageManager uses (DocumentDirectoryPath, mkdir, exists, writeFile,
 * readFile, unlink). Call `__reset()` between tests to clear state, and
 * `__setCorrupted(path, raw)` / `__simulateDiskFull()` to exercise
 * SmartStorage's error-handling paths.
 */

const files = new Map<string, string>();
const directories = new Set<string>(['/mock-documents']);

let diskFullOnNextWrite = false;

function makeFsError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

const DocumentDirectoryPath = '/mock-documents';

const mkdir = jest.fn(async (path: string): Promise<void> => {
  directories.add(path);
});

const exists = jest.fn(async (path: string): Promise<boolean> => {
  return files.has(path) || directories.has(path);
});

const writeFile = jest.fn(async (path: string, contents: string): Promise<void> => {
  if (diskFullOnNextWrite) {
    diskFullOnNextWrite = false;
    throw makeFsError('ENOSPC', `ENOSPC: no space left on device, write '${path}'`);
  }
  files.set(path, contents);
});

const readFile = jest.fn(async (path: string): Promise<string> => {
  if (!files.has(path)) {
    throw makeFsError('ENOENT', `ENOENT: no such file or directory, open '${path}'`);
  }
  return files.get(path) as string;
});

const unlink = jest.fn(async (path: string): Promise<void> => {
  if (files.has(path)) {
    files.delete(path);
    return;
  }
  if (directories.has(path)) {
    for (const key of Array.from(files.keys())) {
      if (key.startsWith(`${path}/`)) files.delete(key);
    }
    directories.delete(path);
    return;
  }
  throw makeFsError('ENOENT', `ENOENT: no such file or directory, unlink '${path}'`);
});

/** Test helper — not part of the real react-native-fs API. Resets all in-memory state. */
function __reset(): void {
  files.clear();
  directories.clear();
  directories.add(DocumentDirectoryPath);
  diskFullOnNextWrite = false;
  mkdir.mockClear();
  exists.mockClear();
  writeFile.mockClear();
  readFile.mockClear();
  unlink.mockClear();
}

/** Test helper — directly injects/corrupts a file's raw content without going through writeFile. */
function __setFileContent(path: string, content: string): void {
  files.set(path, content);
}

/** Test helper — makes the next writeFile() call reject with an ENOSPC (disk full) error. */
function __simulateDiskFullOnNextWrite(): void {
  diskFullOnNextWrite = true;
}

/** Test helper — inspects the current in-memory file map (path -> content). */
function __getFiles(): Map<string, string> {
  return new Map(files);
}

// This file is a CommonJS Jest manual mock (Jest resolves `__mocks__/*`
// through `require`, not ESM import), so it intentionally uses
// `module.exports` instead of an ES `export` — hence the ts-ignore below,
// since this project's tsconfig doesn't include Node's ambient `module` type.
// @ts-ignore
module.exports = {
  DocumentDirectoryPath,
  mkdir,
  exists,
  writeFile,
  readFile,
  unlink,
  __reset,
  __setFileContent,
  __simulateDiskFullOnNextWrite,
  __getFiles,
};
