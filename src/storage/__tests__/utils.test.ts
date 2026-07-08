import { serialize, deserialize, tryDeserialize, getByteSize, deepMerge, buildFilePath, buildFolderPath, isValidFolderName } from '../utils';
import { SerializationError } from '../errors';

describe('storage/utils — serialize/deserialize', () => {
  it('stores strings as-is (no double stringification)', () => {
    expect(serialize('k', 'hello')).toBe('hello');
  });

  it('JSON.stringify-serializes a plain object', () => {
    expect(serialize('k', { a: 1, b: 'x' })).toBe(JSON.stringify({ a: 1, b: 'x' }));
  });

  it('JSON.stringify-serializes an array', () => {
    expect(serialize('k', [1, 2, 3])).toBe(JSON.stringify([1, 2, 3]));
  });

  it('JSON.stringify-serializes a nested object', () => {
    const value = { a: { b: { c: [1, 2, { d: true }] } } };
    expect(serialize('k', value)).toBe(JSON.stringify(value));
  });

  it('serializes numbers, booleans, and null', () => {
    expect(serialize('k', 42)).toBe('42');
    expect(serialize('k', true)).toBe('true');
    expect(serialize('k', false)).toBe('false');
    expect(serialize('k', null)).toBe('null');
  });

  it('throws SerializationError for non-JSON-serializable values', () => {
    expect(() => serialize('k', undefined)).toThrow(SerializationError);
    expect(() => serialize('k', () => {})).toThrow(SerializationError);
  });

  it('round-trips objects, arrays, numbers, booleans, and null through deserialize', () => {
    expect(deserialize(serialize('k', { a: 1 }))).toEqual({ a: 1 });
    expect(deserialize(serialize('k', [1, 'x', null]))).toEqual([1, 'x', null]);
    expect(deserialize(serialize('k', 42))).toBe(42);
    expect(deserialize(serialize('k', true))).toBe(true);
    expect(deserialize(serialize('k', null))).toBe(null);
  });

  it('falls back to the raw string when it is not valid JSON', () => {
    expect(deserialize('not json at all')).toBe('not json at all');
  });

  it('tryDeserialize never throws on invalid JSON strings', () => {
    expect(tryDeserialize('{broken')).toBe('{broken');
    expect(tryDeserialize({ already: 'object' })).toEqual({ already: 'object' });
  });
});

describe('storage/utils — getByteSize', () => {
  it('counts single-byte ASCII characters as 1 byte each', () => {
    expect(getByteSize('hello')).toBe(5);
  });

  it('counts multi-byte UTF-8 characters correctly', () => {
    // "é" is 2 bytes in UTF-8, "中" is 3 bytes, an emoji (surrogate pair) is 4 bytes.
    expect(getByteSize('é')).toBe(2);
    expect(getByteSize('中')).toBe(3);
    expect(getByteSize('😀')).toBe(4);
  });

  it('returns 0 for an empty string', () => {
    expect(getByteSize('')).toBe(0);
  });
});

describe('storage/utils — deepMerge', () => {
  it('merges nested objects recursively', () => {
    const existing = { a: 1, nested: { x: 1, y: 2 } };
    const incoming = { nested: { y: 20, z: 3 } };
    expect(deepMerge(existing, incoming)).toEqual({ a: 1, nested: { x: 1, y: 20, z: 3 } });
  });

  it('replaces arrays wholesale rather than concatenating', () => {
    const existing = { list: [1, 2, 3] };
    const incoming = { list: [9] };
    expect(deepMerge(existing, incoming)).toEqual({ list: [9] });
  });

  it('replaces primitive values outright', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    expect(deepMerge('old', 'new')).toBe('new');
  });

  it('treats a null/undefined existing value as "nothing to merge with"', () => {
    expect(deepMerge(null, { a: 1 })).toEqual({ a: 1 });
  });

  it('leaves existing untouched when incoming is undefined', () => {
    expect(deepMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
  });
});

describe('storage/utils — file paths', () => {
  it('builds a deterministic path stable across calls', () => {
    const a = buildFilePath('/root', 'offline-storage', 'assessment_1');
    const b = buildFilePath('/root', 'offline-storage', 'assessment_1');
    expect(a).toBe(b);
    expect(a.startsWith(buildFolderPath('/root', 'offline-storage'))).toBe(true);
    expect(a.endsWith('.json')).toBe(true);
  });

  it('produces different paths for different keys even after sanitization would collide', () => {
    // Both keys sanitize to the same prefix ("a_b") but must not collide on disk.
    const pathA = buildFilePath('/root', 'offline-storage', 'a:b');
    const pathB = buildFilePath('/root', 'offline-storage', 'a/b');
    expect(pathA).not.toBe(pathB);
  });

  it('validates folder names', () => {
    expect(isValidFolderName('offline-storage')).toBe(true);
    expect(isValidFolderName('a/b')).toBe(false);
    expect(isValidFolderName('..')).toBe(false);
    expect(isValidFolderName('')).toBe(false);
  });
});
