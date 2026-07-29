import { Platform } from 'react-native';
import logger from '@utils/logger';

/**
 * Minimal native filesystem helper for observation answers that embed a
 * base64 file directly (signature/drawing-style questions), as opposed to
 * the separate `files` array. Native only — Android's CursorWindow caps a
 * single SQLite row at ~1-2MB regardless of the database's total size
 * limit, so a raw base64 photo/video can't be saved into an offline record
 * as-is. Extracted here to a private file instead; only lightweight
 * metadata (local path, file size, upload status) goes into the saved
 * answers/offline storage.
 *
 * Web is out of scope by design (ObservationContent keeps storing base64
 * inline on web, unchanged) — these functions are never called there.
 */

const BLOB_DIR_NAME = 'offline-observation-files';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function stripBase64Prefix(data: string): string {
  const commaIndex = data.indexOf(',');
  return data.startsWith('data:') && commaIndex !== -1 ? data.slice(commaIndex + 1) : data;
}

async function getBlobDir(RNBlobUtil: any): Promise<string> {
  const dir = `${RNBlobUtil.fs.dirs.DocumentDir}/${BLOB_DIR_NAME}`;
  if (!(await RNBlobUtil.fs.isDir(dir))) {
    await RNBlobUtil.fs.mkdir(dir).catch(() => {});
  }
  return dir;
}

async function getFilePath(fileName: string): Promise<string> {
  // Dynamic require keeps react-native-blob-util out of the web bundle.
  const RNBlobUtil = require('react-native-blob-util').default;
  const dir = await getBlobDir(RNBlobUtil);
  return `${dir}/${sanitizeFileName(fileName)}`;
}

function getMimeTypeFromBase64(base64: string): string {
  const match = base64.match(/^data:([^;]+);base64,/);
  return match?.[1] ?? 'application/octet-stream';
}

/**
 * Writes base64 (bare or a full data URL — the prefix is stripped) to a
 * private file, returning its local path and size.
 */
export async function saveBase64File(
  fileName: string,
  base64Data: string,
): Promise<{ localPath: string; fileSize: number, mimeType: string } | null> {
  if (Platform.OS === 'web') return null;
  try {
    const path = await getFilePath(fileName);
    const RNBlobUtil = require('react-native-blob-util').default;
    await RNBlobUtil.fs.writeFile(path, stripBase64Prefix(base64Data), 'base64');
    const stat = await RNBlobUtil.fs.stat(path).catch(() => null);
    return { localPath: path, fileSize: stat ? Number(stat.size) || 0 : 0, mimeType: getMimeTypeFromBase64(base64Data) };
  } catch (error) {
    logger.error(`fileStorageService: Error saving file "${fileName}"`, error);
    throw error;
  }
}

/** Reads a file at the given local path back out as bare base64. */
export async function readBase64FileAtPath(localPath: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const RNBlobUtil = require('react-native-blob-util').default;
    if (!(await RNBlobUtil.fs.exists(localPath))) return null;
    return await RNBlobUtil.fs.readFile(localPath, 'base64');
  } catch (error) {
    logger.error(`fileStorageService: Error reading file "${localPath}"`, error);
    return null;
  }
}

/** Deletes a file at the given local path (no-op if it doesn't exist). */
export async function deleteFileAtPath(localPath: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const RNBlobUtil = require('react-native-blob-util').default;
    if (await RNBlobUtil.fs.exists(localPath)) {
      await RNBlobUtil.fs.unlink(localPath);
    }
  } catch (error) {
    logger.error(`fileStorageService: Error deleting file "${localPath}"`, error);
  }
}

const fileStorageService = { saveBase64File, readBase64FileAtPath, deleteFileAtPath };

export default fileStorageService;
