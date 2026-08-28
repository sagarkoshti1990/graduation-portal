import { PILLAR_NAMES } from "@constants/app.constant";
import {Image, Platform} from "react-native"
import logger from '@utils/logger';
export function applyFilters(data: any[], filters: Record<string, any>): any[] {
  return data.filter(item => {
    return Object.keys(filters).every(key => {
      const filterValue = filters[key];
      const itemValue = item[key];

      // Ignore empty filters
      if (
        filterValue === undefined ||
        filterValue === null ||
        filterValue === "" ||
        (Array.isArray(filterValue) && filterValue.length === 0)
      ) {
        return true;
      }

      // ARRAY filter → OR logic
      if (Array.isArray(filterValue)) {
        // string comparison (case-insensitive)
        if (typeof itemValue === "string") {
          return filterValue
            .map(v => v.toLowerCase())
            .includes(itemValue.toLowerCase());
        }
        return filterValue.includes(itemValue);
      }

      // STRING filter → exact match for status field, partial match for others (case-insensitive)
      if (typeof filterValue === "string") {
        // Use exact match for status field to avoid partial matches (e.g., "Onboarded" matching "Not Onboarded")
        if (key === 'status') {
          return String(itemValue).toLowerCase() === filterValue.toLowerCase();
        }
        // Partial match for other string fields (e.g., search)
        return String(itemValue)
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      }

      // DEFAULT → exact match (boolean, number, etc.)
      return itemValue === filterValue;
    });
  });
}

/**
 * Get initials from a name string
 * Rules:
 * - Multiple words → first letter of first name + first letter of last name
 *   Example: "Amol Patil" -> "AP", "John Doe Smith" -> "JS"
 * - Single word → first letter only
 *   Example: "Amol" -> "A"
 * 
 * @param name - The name string to extract initials from
 * @returns The initials string (uppercase)
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '';

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Single name → first letter only
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  // First letter of first name + first letter of last name
  const firstInitial = parts[0][0];
  const lastInitial = parts[parts.length - 1][0];

  return (firstInitial + lastInitial).toUpperCase();
}

/**
 * Sort array of objects by nested key using custom order
 * @param {Array} data - array to sort
 * @param {String} path - nested key (e.g. "user.name")
 * @param {Array} order - custom order array
 * @param {String} direction - "asc" | "desc" (optional)
 */
export const sortByNestedOrder = (data: any[], path: string, order: string[], direction = "asc") => {
  const getValue = (obj: any, path: string) =>
    path.split(".").reduce((acc, key) => acc?.[key], obj);

  const orderMap = Object.fromEntries(
    order.map((val, index) => [val, index])
  );

  return data.sort((a, b) => {
    const valA = getValue(a, path);
    const valB = getValue(b, path);

    const indexA = orderMap[valA] ?? Infinity;
    const indexB = orderMap[valB] ?? Infinity;

    return direction === "asc"
      ? indexA - indexB
      : indexB - indexA;
  });
};


/** MIME type lookup by lowercase file extension. */
const MIME_MAP: Record<string, string> = {
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  mp4:  'video/mp4',
  mp3:  'audio/mpeg',
  zip:  'application/zip',
  txt:  'text/plain',
  csv:  'text/csv',
  json: 'application/json',
};

/** Strips query params and decodes percent-encoding to get a clean filename from a URL. */
function fileNameFromUrl(url: string): string {
  const noQuery = url.split('?')[0];
  return decodeURIComponent(noQuery.split('/').pop() || '');
}

/** Returns the MIME type for the given filename, or 'application/octet-stream'. */
function mimeFromFileName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

/**
 * Downloads a file to the device.
 *
 * - Web: fetch → Blob → <a download>
 * - Android: react-native-blob-util DownloadManager → device Downloads folder
 * - iOS: not supported (no-op; route through a share sheet instead)
 *
 * @param assetSource  URL string or a bundled asset number (Image.resolveAssetSource)
 * @param t            i18n translate function (optional)
 * @param showAlert    Alert callback (type, message) (optional)
 * @param headers      Extra request headers, e.g. { Authorization: 'Bearer …' } (optional)
 */
export const openDownload = async (
  assetSource: number | string,
  t?: any,
  showAlert?: any,
  headers?: Record<string, string>,
) => {
  const uri =
    typeof assetSource === 'string'
      ? assetSource
      : Image.resolveAssetSource(assetSource)?.uri;

  if (!uri) {
    logger.error('openDownload: URI is undefined');
    showAlert?.('error', t?.('downloadForms.downloadUriError'));
    return;
  }

  // -------------------------------------------------------------------------
  // Web
  // -------------------------------------------------------------------------
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const response = await fetch(uri, headers ? { headers } : undefined);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = decodeURIComponent(uri.split('?')[0].split('/').pop() || 'download');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      showAlert?.('success', t?.('downloadForms.downloadSuccess'));
    } catch (err: any) {
      logger.error(`openDownload: web download failed — ${err?.message ?? err}`);
      showAlert?.('error', t?.('downloadForms.downloadError'));
    }
    return;
  }

  // -------------------------------------------------------------------------
  // Android — Android DownloadManager via react-native-blob-util
  // Dynamic require keeps the native module out of the web bundle.
  // -------------------------------------------------------------------------
  if (Platform.OS !== 'android') {
    logger.warn('openDownload: native download is only supported on Android');
    return;
  }

  try {
    const RNBlobUtil = require('react-native-blob-util').default;

    // Derive a clean filename from the URL (strip query params first)
    let fileName = fileNameFromUrl(uri);
    if (!fileName || !fileName.includes('.')) {
      // No extension found — add .bin so DownloadManager can classify the file
      fileName = `file_${Date.now()}.bin`;
    }

    const mimeType = mimeFromFileName(fileName);
    // Explicit destination in the device's Downloads directory — required on
    // Android 10+ for the file to appear in the system Files / Downloads app.
    const destPath = `${RNBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

    logger.info(
      `openDownload: starting — file="${fileName}", mime="${mimeType}", dest="${destPath}"`,
    );

    const res = await RNBlobUtil.config({
      fileCache: false,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        title: fileName,
        description: t?.('downloadForms.downloading') ?? 'Downloading file…',
        mime: mimeType,
        mediaScannable: true,
        path: destPath,
      },
    }).fetch('GET', uri, headers ?? {});

    const savedPath: string = res.path();
    const status: number  = res.respInfo?.status;
    const respHeaders: Record<string, string> = res.respInfo?.headers ?? {};

    logger.info(`openDownload: completed — path="${savedPath}", status=${status}`);
    logger.info('openDownload: response headers', respHeaders);

    showAlert?.('success', t?.('downloadForms.downloadSuccess') ?? 'Download completed successfully.');
  } catch (err: any) {
    logger.error(`openDownload: download failed — ${err?.message ?? err}`);
    showAlert?.('error', t?.('downloadForms.downloadError') ?? 'Failed to download file.');
  }
};

export const toCamelCase = (str: string): any => {
  if(typeof str !== "string") {
    return str
  }
  return str
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, char) =>
      char ? char.toUpperCase() : ''
    );
};

// ---------------------------------------------------------------------------
// Embedded-file extraction for observation answers
//
// Some questionnaire question types (signature/drawing, etc.) embed a base64
// data URL directly inside the answers object rather than referencing the
// separate `files` array. On native, that raw base64 must never be persisted
// into offline storage as-is (a single embedded photo/video can exceed
// Android's per-row SQLite limit) — it's extracted to a file and replaced
// with a metadata marker at save time. findEmbeddedFiles recognizes BOTH
// that marker (native, already extracted) and raw data URLs (web, or any
// record saved before this existed) so sync-time upload logic works
// uniformly either way.
// ---------------------------------------------------------------------------

export interface OfflineFileMetadata {
  __offlineFile: true;
  localPath: string;
  fileName: string;
  originalName?: string;
  fileType: string;
  fileSize?: number;
  uploadStatus: 'pending';
}

export type EmbeddedFileEntry =
  | { kind: 'inline'; path: (string | number)[]; dataUrl: string; mimeType: string; fileName: string }
  | {
      kind: 'blob';
      path: (string | number)[];
      localPath: string;
      fileName: string;
      originalName?: string;
      mimeType: string;
      fileSize?: number;
    }
  | {
      kind: 'stored';
      path: (string | number)[];
      dataUrl: string;
      fileName: string;
      originalName?: string;
      mimeType: string;
      fieldId?: string;
    };

/** Builds the metadata object that replaces an embedded data URL once extracted to a file. */
export function makeOfflineFileMetadata(
  meta: Omit<OfflineFileMetadata, '__offlineFile' | 'uploadStatus'>,
): OfflineFileMetadata {
  return { __offlineFile: true, uploadStatus: 'pending', ...meta };
}

function isOfflineFileMetadata(value: unknown): value is OfflineFileMetadata {
  return !!value && typeof value === 'object' && (value as any).__offlineFile === true;
}

/**
 * File-answer objects produced by the web component for file-type questions,
 * e.g. { name, isUploaded: false, originalName, type, storedFile: { key, data }, submissionId }.
 * `submissionId` here is actually the question's qid, not the form submissionId.
 */
function isStoredFileAnswer(value: unknown): value is {
  name: string;
  originalName?: string;
  type?: string;
  submissionId?: string;
  isUploaded?: boolean;
  storedFile: { key?: string; data: string };
} {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as any).storedFile?.data === 'string' &&
    (value as any).isUploaded !== true
  );
}

/**
 * Recursively finds base64 data-URL strings and offline-file metadata
 * markers anywhere inside an arbitrary JSON-like object (e.g. observation
 * answers). Read-only — never mutates `obj`. `namePrefix`/`startIndex` seed
 * generated fileNames for newly found inline data URLs (metadata markers
 * already carry their own fileName).
 */
export function findEmbeddedFiles(obj: any, namePrefix: string, startIndex = 0): EmbeddedFileEntry[] {
  const entries: EmbeddedFileEntry[] = [];
  function walk(node: any, path: (string | number)[]): void {
    if (!node || typeof node !== 'object') return;
    if (isOfflineFileMetadata(node)) {
      entries.push({
        kind: 'blob',
        path,
        localPath: node.localPath,
        fileName: node.fileName,
        originalName: node.originalName,
        mimeType: node.fileType,
        fileSize: node.fileSize,
      });
      return; // don't descend into the metadata object's own fields
    }
    if (isStoredFileAnswer(node)) {
      entries.push({
        kind: 'stored',
        path,
        dataUrl: node.storedFile.data,
        fileName: node.name,
        originalName: node.originalName,
        mimeType: node.type ?? 'application/octet-stream',
        fieldId: node.submissionId,
      });
      return; // don't descend into the file answer's own fields
    }
    const keys = Array.isArray(node) ? node.map((_, i) => i as string | number) : Object.keys(node);
    for (const key of keys) {
      const val = (node as any)[key];
      const currentPath = [...path, key];
      if (typeof val === 'string' && val.startsWith('data:') && val.includes(';base64,')) {
        const mimeMatch = val.match(/^data:([^;]+);/);
        const mimeType = mimeMatch?.[1] ?? 'application/octet-stream';
        const ext = mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') ?? 'bin';
        entries.push({
          kind: 'inline',
          path: currentPath,
          dataUrl: val,
          mimeType,
          fileName: `${namePrefix}-${startIndex + entries.length}.${ext}`,
        });
      } else if (val && typeof val === 'object') {
        walk(val, currentPath);
      }
    }
  }
  walk(obj, []);
  return entries;
}

/** Writes `value` at `path` inside `obj`, mutating it in place. No-op if an intermediate node is missing. */
export function setAtPath(obj: any, path: (string | number)[], value: any): void {
  let node = obj;
  for (let i = 0; i < path.length - 1; i++) {
    node = node?.[path[i]];
    if (node == null) return;
  }
  if (node != null) node[path[path.length - 1]] = value;
}

export const getAnswerData = (items:any[],answers:any) => {
  let value:any = {};
  items.forEach((item:any) => {
    const data = Object.values(answers).find((itemData : any) => itemData?.qid === item.qid || itemData?.payload?.question?.includes(item.label))
    const keyName = item.keyName || toCamelCase(item.label);
    // @ts-ignore
    value = {...value,[keyName]: data?.payload?.labels || ""}
  });
  return value;
}


function getPillarOrderIndex(name = ''): number {
  const normalized = name.toLowerCase();
  const order = [
    PILLAR_NAMES.SOCIAL_EMPOWERMENT,
    PILLAR_NAMES.LIVELIHOOD,
    PILLAR_NAMES.FINANCIAL_INCLUSION,
    PILLAR_NAMES.SOCIAL_PROTECTION,
  ];
  const index = order.findIndex(pillar => normalized.includes(pillar));
  return index === -1 ? order.length : index;
}

const sortByExternalIdOrder = (
  data: any[],
  order: string[]
) => {
  const orderMap = new Map(
    order.map((item, index) => [item, index])
  );

  return [...data].sort((a, b) => {
    return (
      (orderMap.get(a.externalId) ?? Infinity) -
      (orderMap.get(b.externalId) ?? Infinity)
    );
  });
};

export const sortTasksWithChildren = (tasks: any[] = []) => {
  return [...tasks]
    .sort(
      (a, b) =>
        getPillarOrderIndex(a?.name) -
        getPillarOrderIndex(b?.name),
    )
    .map((task) => {
      if (task?.children?.length) {
        return {
          ...task,
          children: sortByExternalIdOrder(
            task.children,
            task.taskSequence ?? [],
          ),
        };
      }

      return task;
    });
};

export const removeFileFromAnsers = (value:any) => {
  const files: any[] = []
  
  if (Array.isArray(value)) {
    value = value.map((file: any) => {
      if (file?.storedFile) {
        // Remove storedFile from the file object
        const { storedFile, ...rest } = file;
        files.push({...file,storedFile});
        return rest;
      }

      return file;
    });
  }
  return {value,files}
}
export function shouldFetchOnline(
  offline: {
    updatedAt: string;
    status: string;
  },
  online: {
    updatedAt: string;
    status: string;
  },
): boolean {
  if(!offline?.updatedAt) {
    return true;
  }
  
  const offlineTime = new Date(offline?.updatedAt).getTime();
  const onlineTime = new Date(online?.updatedAt).getTime();

  // Online is newer
  if (onlineTime > offlineTime) {
    return true;
  }

  // Offline is newer
  if (offlineTime > onlineTime) {
    return false;
  }

  // Same timestamp -> compare status
  // return (
  //   OBSERVATION_STATUS_PRIORITY[online.status] >
  //   OBSERVATION_STATUS_PRIORITY[offline.status]
  // );

  return false;
}

export function getCustomTaskIds(tasks: any[]): string[] {
  const customTaskIds: string[] = [];

  const traverse = (taskList: any[]) => {
    taskList.forEach((task) => {
      if (task.isCustomTask === true) {
        customTaskIds.push(task._id);
      }

      if (Array.isArray(task.children) && task.children.length > 0) {
        traverse(task.children);
      }
    });
  };

  traverse(tasks);

  return customTaskIds;
}