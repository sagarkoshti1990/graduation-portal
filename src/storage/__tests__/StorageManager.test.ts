/**
 * Integration-level tests for StorageManager, driven through real
 * AsyncStorageManager + FileStorageManager instances wired to:
 *  - the official @react-native-async-storage/async-storage Jest mock
 *  - this repo's __mocks__/react-native-fs.ts in-memory virtual filesystem
 *
 * A tiny `maxInlineSize` is used throughout so "large" values are trivial
 * to construct without needing real 200KB+ fixtures.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageManager } from '../StorageManager';
import { AsyncStorageManager } from '../AsyncStorageManager';
import { FileStorageManager } from '../FileStorageManager';
import { ConfigurationManager } from '../Configuration';
import { DiskFullError } from '../errors';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const RNFSMock = require('react-native-fs');

const SMALL_INLINE_LIMIT = 40; // bytes — anything bigger is "large" for these tests

function makeStorageManager(maxInlineSize = SMALL_INLINE_LIMIT): StorageManager {
  const config = new ConfigurationManager();
  config.configure({ maxInlineSize, folderName: 'offline-storage-test' });
  return new StorageManager(new AsyncStorageManager(), new FileStorageManager(), config);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  RNFSMock.__reset();
});

describe('StorageManager — value types (all stored inline, well under the size threshold)', () => {
  const storage = makeStorageManager();

  it('round-trips a small object', async () => {
    await storage.setItem('obj', { a: 1, b: 'x' });
    await expect(storage.getItem('obj')).resolves.toEqual({ a: 1, b: 'x' });
  });

  it('round-trips a nested object', async () => {
    const value = { a: { b: { c: [1, 2, { d: true }] } } };
    await storage.setItem('nested', value);
    await expect(storage.getItem('nested')).resolves.toEqual(value);
  });

  it('round-trips an array', async () => {
    await storage.setItem('arr', [1, 'two', { three: 3 }]);
    await expect(storage.getItem('arr')).resolves.toEqual([1, 'two', { three: 3 }]);
  });

  it('round-trips a string without double-stringification', async () => {
    await storage.setItem('str', 'hello world');
    await expect(storage.getItem('str')).resolves.toBe('hello world');
    const raw = await AsyncStorage.getItem('str');
    expect(raw).toBe('hello world'); // not '"hello world"'
  });

  it('round-trips a boolean', async () => {
    await storage.setItem('bool', true);
    await expect(storage.getItem('bool')).resolves.toBe(true);
  });

  it('round-trips a number', async () => {
    await storage.setItem('num', 12345);
    await expect(storage.getItem('num')).resolves.toBe(12345);
  });

  it('round-trips null', async () => {
    await storage.setItem('nil', null);
    await expect(storage.getItem('nil')).resolves.toBe(null);
  });

  it('returns null for a key that was never set', async () => {
    await expect(storage.getItem('never-set')).resolves.toBe(null);
  });
});

describe('StorageManager — large values spill to the filesystem', () => {
  const storage = makeStorageManager();
  const largeValue = { payload: 'x'.repeat(500) };

  it('stores only a metadata envelope in AsyncStorage, and the real value on disk', async () => {
    await storage.setItem('large', largeValue);

    const raw = await AsyncStorage.getItem('large');
    const parsed = JSON.parse(raw as string);
    expect(parsed.__offline_file__).toBe(true);
    expect(typeof parsed.path).toBe('string');
    expect(parsed.path).toContain('offline-storage-test');
    expect(parsed.size).toBeGreaterThan(SMALL_INLINE_LIMIT);

    const files = RNFSMock.__getFiles();
    expect(files.has(parsed.path)).toBe(true);
    expect(JSON.parse(files.get(parsed.path))).toEqual(largeValue);
  });

  it('getItem transparently reads the file and returns the original value', async () => {
    await storage.setItem('large2', largeValue);
    await expect(storage.getItem('large2')).resolves.toEqual(largeValue);
  });

  it('creates the storage folder automatically', async () => {
    await storage.setItem('large3', largeValue);
    expect(RNFSMock.mkdir).toHaveBeenCalled();
  });
});

describe('StorageManager — overwrite behavior', () => {
  const storage = makeStorageManager();
  const largeValue = { payload: 'x'.repeat(500) };

  it('overwrites a small value with another small value', async () => {
    await storage.setItem('k', 'first');
    await storage.setItem('k', 'second');
    await expect(storage.getItem('k')).resolves.toBe('second');
  });

  it('overwrites a small value with a large value (transitions to file-backed)', async () => {
    await storage.setItem('k', 'small');
    await storage.setItem('k', largeValue);
    await expect(storage.getItem('k')).resolves.toEqual(largeValue);
    const raw = JSON.parse((await AsyncStorage.getItem('k')) as string);
    expect(raw.__offline_file__).toBe(true);
  });

  it('overwriting a large value with a small value deletes the orphaned file', async () => {
    await storage.setItem('k', largeValue);
    const raw = JSON.parse((await AsyncStorage.getItem('k')) as string);
    expect(RNFSMock.__getFiles().has(raw.path)).toBe(true);

    await storage.setItem('k', 'small now');

    expect(RNFSMock.__getFiles().has(raw.path)).toBe(false); // old file cleaned up
    await expect(storage.getItem('k')).resolves.toBe('small now');
  });

  it('overwriting a large value with another large value replaces the same file path deterministically', async () => {
    await storage.setItem('k', largeValue);
    const rawBefore = JSON.parse((await AsyncStorage.getItem('k')) as string);

    const newLargeValue = { payload: 'y'.repeat(600) };
    await storage.setItem('k', newLargeValue);
    const rawAfter = JSON.parse((await AsyncStorage.getItem('k')) as string);

    expect(rawAfter.path).toBe(rawBefore.path);
    await expect(storage.getItem('k')).resolves.toEqual(newLargeValue);
  });
});

describe('StorageManager — removeItem (delete)', () => {
  const storage = makeStorageManager();

  it('deletes an inline value', async () => {
    await storage.setItem('k', 'value');
    await storage.removeItem('k');
    await expect(storage.getItem('k')).resolves.toBe(null);
  });

  it('deletes a file-backed value and its backing file', async () => {
    const largeValue = { payload: 'x'.repeat(500) };
    await storage.setItem('k', largeValue);
    const raw = JSON.parse((await AsyncStorage.getItem('k')) as string);

    await storage.removeItem('k');

    expect(RNFSMock.__getFiles().has(raw.path)).toBe(false);
    await expect(storage.getItem('k')).resolves.toBe(null);
  });

  it('is a safe no-op for a key that does not exist', async () => {
    await expect(storage.removeItem('does-not-exist')).resolves.toBeUndefined();
  });
});

describe('StorageManager — graceful error handling', () => {
  const storage = makeStorageManager();
  const largeValue = { payload: 'x'.repeat(500) };

  it('self-heals when a metadata envelope points at a missing file', async () => {
    await storage.setItem('k', largeValue);
    const raw = JSON.parse((await AsyncStorage.getItem('k')) as string);

    // Simulate the file vanishing outside of SmartStorage's own bookkeeping.
    await RNFSMock.unlink(raw.path);

    await expect(storage.getItem('k')).resolves.toBe(null);
    // Self-healing: the dangling AsyncStorage entry is cleared too.
    await expect(storage.getAllKeys()).resolves.not.toContain('k');
  });

  it('never throws when the backing file content is corrupted (not valid JSON)', async () => {
    await storage.setItem('k', largeValue);
    const raw = JSON.parse((await AsyncStorage.getItem('k')) as string);

    RNFSMock.__setFileContent(raw.path, '{not valid json');

    // Falls back to returning the raw corrupted string rather than throwing —
    // consistent with this app's existing "JSON.parse or return raw string" convention.
    await expect(storage.getItem('k')).resolves.toBe('{not valid json');
  });

  it('never throws when the AsyncStorage entry itself is corrupted', async () => {
    await AsyncStorage.setItem('k', '{also not valid json');
    await expect(storage.getItem('k')).resolves.toBe('{also not valid json');
  });

  it('propagates a classified DiskFullError when the filesystem is full', async () => {
    RNFSMock.__simulateDiskFullOnNextWrite();
    await expect(storage.setItem('k', largeValue)).rejects.toBeInstanceOf(DiskFullError);
  });
});

describe('StorageManager — clear()', () => {
  const storage = makeStorageManager();

  it('removes every key it created and deletes their backing files', async () => {
    const largeValue = { payload: 'x'.repeat(500) };
    await storage.setItem('small', 'value');
    await storage.setItem('large', largeValue);
    const raw = JSON.parse((await AsyncStorage.getItem('large')) as string);

    await storage.clear();

    await expect(storage.getItem('small')).resolves.toBe(null);
    await expect(storage.getItem('large')).resolves.toBe(null);
    expect(RNFSMock.__getFiles().has(raw.path)).toBe(false);
    await expect(storage.getAllKeys()).resolves.toEqual([]);
  });

  it('does not clear unrelated AsyncStorage keys never written through SmartStorage', async () => {
    await AsyncStorage.setItem('someone-elses-key', 'untouched');
    await storage.setItem('mine', 'value');

    await storage.clear();

    await expect(AsyncStorage.getItem('someone-elses-key')).resolves.toBe('untouched');
  });
});

describe('StorageManager — mergeItem()', () => {
  const storage = makeStorageManager();

  it('deep-merges into an existing inline object', async () => {
    await storage.setItem('k', { a: 1, nested: { x: 1 } });
    await storage.mergeItem('k', { nested: { y: 2 } });
    await expect(storage.getItem('k')).resolves.toEqual({ a: 1, nested: { x: 1, y: 2 } });
  });

  it('replaces arrays wholesale rather than concatenating', async () => {
    await storage.setItem('k', { list: [1, 2, 3] });
    await storage.mergeItem('k', { list: [9] });
    await expect(storage.getItem('k')).resolves.toEqual({ list: [9] });
  });

  it('sets the value directly when the key does not yet exist', async () => {
    await storage.mergeItem('brand-new', { a: 1 });
    await expect(storage.getItem('brand-new')).resolves.toEqual({ a: 1 });
  });

  it('works transparently on a file-backed (large) existing value', async () => {
    await storage.setItem('k', { payload: 'x'.repeat(500), extra: { a: 1 } });
    await storage.mergeItem('k', { extra: { b: 2 } });
    const result = await storage.getItem<any>('k');
    expect(result.extra).toEqual({ a: 1, b: 2 });
    expect(result.payload).toBe('x'.repeat(500));
  });

  it('accepts a pre-stringified JSON string like real AsyncStorage.mergeItem', async () => {
    await storage.setItem('k', { a: 1 });
    await storage.mergeItem('k', JSON.stringify({ b: 2 }));
    await expect(storage.getItem('k')).resolves.toEqual({ a: 1, b: 2 });
  });
});

describe('StorageManager — multiGet / multiSet / multiRemove', () => {
  const storage = makeStorageManager();
  const largeValue = { payload: 'x'.repeat(500) };

  it('multiSet determines storage strategy independently per item', async () => {
    await storage.multiSet([
      ['small', 'value'],
      ['large', largeValue],
      ['num', 42],
    ]);

    const rawLarge = JSON.parse((await AsyncStorage.getItem('large')) as string);
    expect(rawLarge.__offline_file__).toBe(true);
    const rawSmall = await AsyncStorage.getItem('small');
    expect(rawSmall).toBe('value');
  });

  it('multiGet transparently resolves both inline and file-backed values, preserving order', async () => {
    await storage.multiSet([
      ['a', 'one'],
      ['b', largeValue],
      ['c', 3],
    ]);

    const result = await storage.multiGet(['a', 'b', 'c', 'missing']);

    expect(result).toEqual([
      ['a', 'one'],
      ['b', largeValue],
      ['c', 3],
      ['missing', null],
    ]);
  });

  it('multiRemove deletes AsyncStorage entries and backing files together', async () => {
    await storage.multiSet([
      ['a', 'one'],
      ['b', largeValue],
    ]);
    const rawB = JSON.parse((await AsyncStorage.getItem('b')) as string);

    await storage.multiRemove(['a', 'b']);

    await expect(storage.getItem('a')).resolves.toBe(null);
    await expect(storage.getItem('b')).resolves.toBe(null);
    expect(RNFSMock.__getFiles().has(rawB.path)).toBe(false);
  });
});

describe('StorageManager — getAllKeys()', () => {
  const storage = makeStorageManager();

  it('returns only logical keys SmartStorage created, never the internal registry key', async () => {
    await storage.setItem('a', 1);
    await storage.setItem('b', 2);

    const keys = await storage.getAllKeys();

    expect(keys.sort()).toEqual(['a', 'b']);
    expect(keys).not.toContain('__smart_storage_registry__');
  });
});
