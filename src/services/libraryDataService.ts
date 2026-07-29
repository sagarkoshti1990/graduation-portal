/**
 * Warms the offline cache for IDP (Intervention Plan) reference data — the full
 * library category hierarchy and the full project templates list. Both are
 * global, read-only reference data (not participant-scoped), downloaded once at
 * login so "Develop Intervention Plan" (Template screen) can be browsed offline.
 *
 * Smart data handling: each `ensure*` checks the cache first and returns it
 * untouched when present — this is safe to call repeatedly (e.g. on every login
 * and session restore) without re-fetching.
 */
import logger from '@utils/logger';
import offlineStorage from './offlineStorage';
import { OFFLINE_KEYS } from '@constants/STORAGE_KEYS';
import { getAllLibraryCategories, getProjectTemplatesList } from '../project-player/services/projectPlayerService';
import { isNetworkOffline } from '@utils/networkStatus';

export async function ensureLibraryCategoriesDownloaded(): Promise<any[]> {
  
  if(isNetworkOffline()) {
    const cached = await offlineStorage.read<any[]>(OFFLINE_KEYS.LIBRARY_CATEGORIES_TREE).catch(() => null);
    if (cached) return cached;
  }

  const response = await getAllLibraryCategories();
  if (response.error || !response.data) {
    throw new Error(response.error ?? 'Failed to download library categories');
  }
  const tree = response.data ?? [];
  await offlineStorage.create(OFFLINE_KEYS.LIBRARY_CATEGORIES_TREE, tree);
  return tree;
}

export async function ensureProjectTemplatesDownloaded(): Promise<any[]> {

  if(isNetworkOffline()) {
    const cached = await offlineStorage.read<any[]>(OFFLINE_KEYS.PROJECT_TEMPLATES_ALL).catch(() => null);
    if (cached) return cached;
  }
  
  const response = await getProjectTemplatesList();
  if (response.error || !response.data) {
    throw new Error(response.error ?? 'Failed to download project templates');
  }
  const templates = response.data ?? [];
  await offlineStorage.create(OFFLINE_KEYS.PROJECT_TEMPLATES_ALL, templates);
  return templates;
}

/** Downloads categories, then templates, in sequence — the single entry point called at login. */
export async function syncLibraryMasterData(): Promise<void> {
  await ensureLibraryCategoriesDownloaded();
  await ensureProjectTemplatesDownloaded();
  logger.info('libraryDataService: IDP library master data ready offline');
}
