/**
 * Regression tests for offlineStorage.ts's public API after migrating its
 * internal native (non-IndexedDB) storage from raw AsyncStorage to
 * SmartStorage. These intentionally test only the public surface
 * (create/read/remove/etc.) — the goal is to prove the contract this
 * module's many callers (repositories, sync services, download service)
 * depend on is unchanged, not to re-test SmartStorage's own internals
 * (see src/storage/__tests__ for that).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineStorage from '../offlineStorage';
import { configurationManager } from '../../storage/Configuration';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const RNFSMock = require('react-native-fs');

beforeAll(() => {
  // Small threshold so "large" values are trivial to construct in tests.
  configurationManager.configure({ maxInlineSize: 40 });
});

afterAll(() => {
  configurationManager.resetToDefaults();
});

beforeEach(async () => {
  await AsyncStorage.clear();
  RNFSMock.__reset();
});

describe('offlineStorage — public API is unchanged after the SmartStorage migration', () => {
  it('create/read round-trips a small value inline', async () => {
    await offlineStorage.create('settings:small', { theme: 'dark' });
    await expect(offlineStorage.read('settings:small')).resolves.toEqual({ theme: 'dark' });
  });

  it('create/read round-trips a large value transparently via file storage', async () => {
    const large = { payload: 'x'.repeat(500) };
    await offlineStorage.create('settings:large', large);

    // The caller-visible contract is unaffected...
    await expect(offlineStorage.read('settings:large')).resolves.toEqual(large);

    // ...even though under the hood it's now file-backed, not a plain AsyncStorage string.
    const raw = await AsyncStorage.getItem('settings:large');
    expect(JSON.parse(raw as string).__offline_file__).toBe(true);
  });

  it('update() aliases create() and overwrites correctly', async () => {
    await offlineStorage.create('k', 'v1');
    await offlineStorage.update('k', 'v2');
    await expect(offlineStorage.read('k')).resolves.toBe('v2');
  });

  it('remove() deletes both small and large (file-backed) values', async () => {
    await offlineStorage.create('small', 'value');
    await offlineStorage.create('large', { payload: 'x'.repeat(500) });

    await offlineStorage.remove('small');
    await offlineStorage.remove('large');

    await expect(offlineStorage.read('small')).resolves.toBe(null);
    await expect(offlineStorage.read('large')).resolves.toBe(null);
  });

  it('exists() reflects both small and large values, and false after removal', async () => {
    await offlineStorage.create('k', { payload: 'x'.repeat(500) });
    await expect(offlineStorage.exists('k')).resolves.toBe(true);
    await offlineStorage.remove('k');
    await expect(offlineStorage.exists('k')).resolves.toBe(false);
  });

  it('createMultiple/readMultiple/removeMultiple round-trip a mixed batch', async () => {
    const large = { payload: 'x'.repeat(500) };
    await offlineStorage.createMultiple<unknown>([
      { key: 'a', value: 'one' },
      { key: 'b', value: large },
      { key: 'c', value: 3 },
    ]);

    const results = await offlineStorage.readMultiple<unknown>(['a', 'b', 'c', 'missing']);
    expect(results).toEqual([
      { key: 'a', value: 'one' },
      { key: 'b', value: large },
      { key: 'c', value: 3 },
      { key: 'missing', value: null },
    ]);

    await offlineStorage.removeMultiple(['a', 'b', 'c']);
    const afterRemoval = await offlineStorage.readMultiple(['a', 'b', 'c']);
    expect(afterRemoval.every(r => r.value === null)).toBe(true);
  });

  it('getParticipantKeys() finds native participant keys written via create()', async () => {
    await offlineStorage.create('participant:user1:p1:profile', { name: 'Jane' });
    await offlineStorage.create('participant:user1:p1:project:proj1', { tasks: [] });
    await offlineStorage.create('participant:user1:p2:profile', { name: 'Other' });

    const keys = await offlineStorage.getParticipantKeys('user1', 'p1');

    expect(keys.sort()).toEqual(['participant:user1:p1:profile', 'participant:user1:p1:project:proj1'].sort());
  });

  it('clearAll() removes SmartStorage-backed data and cleans up file-backed content', async () => {
    await offlineStorage.create('small', 'value');
    const large = { payload: 'x'.repeat(500) };
    await offlineStorage.create('large', large);
    const raw = JSON.parse((await AsyncStorage.getItem('large')) as string);
    expect(RNFSMock.__getFiles().has(raw.path)).toBe(true);

    await offlineStorage.clearAll();

    await expect(offlineStorage.read('small')).resolves.toBe(null);
    await expect(offlineStorage.read('large')).resolves.toBe(null);
    expect(RNFSMock.__getFiles().has(raw.path)).toBe(false);
  });

  it('addOfflineParticipantId / getOfflineParticipantIds / isParticipantOffline still work end-to-end', async () => {
    await offlineStorage.create('unrelated', 'noop'); // sanity: doesn't interfere
    const { addOfflineParticipantId, getOfflineParticipantIds, isParticipantOffline, removeOfflineParticipantId } =
      require('../offlineStorage');

    await addOfflineParticipantId('user1', 'p1');
    await addOfflineParticipantId('user1', 'p2');
    await expect(getOfflineParticipantIds('user1')).resolves.toEqual(['p1', 'p2']);
    await expect(isParticipantOffline('user1', 'p1')).resolves.toBe(true);

    await removeOfflineParticipantId('user1', 'p1');
    await expect(getOfflineParticipantIds('user1')).resolves.toEqual(['p2']);
    await expect(isParticipantOffline('user1', 'p1')).resolves.toBe(false);
  });
});
