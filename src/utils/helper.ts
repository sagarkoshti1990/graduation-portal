import {Image, Platform} from "react-native"
import ReactNativeBlobUtil from 'react-native-blob-util';
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


export const openDownload = async (
  assetSource: number | string,
  t?: any,
  showAlert?: any
) => {
  const uri =
    typeof assetSource === 'string'
      ? assetSource
      : Image.resolveAssetSource(assetSource)?.uri;

  if (!uri) {
    console.error('Download failed: URI is undefined');
    showAlert?.('error', t?.('downloadForms.downloadUriError'));
    return;
  }

  // =========================
  // 🌐 WEB DOWNLOAD (BLOB)
  // =========================
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const response = await fetch(uri);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;

      const filename = uri.split('/').pop() || 'download';
      link.download = decodeURIComponent(filename);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

      showAlert?.('success', t?.('downloadForms.downloadSuccess'));
    } catch (error) {
      console.error('Web download error:', error);
      showAlert?.('error', t?.('downloadForms.downloadError'));
    }

    return;
  }

  // =========================
  // 📱 NATIVE DOWNLOAD
  // =========================
  try {
    const { config, fs } = ReactNativeBlobUtil;

    const downloads = fs.dirs.DownloadDir;
    const filename =
      decodeURIComponent(uri.split('/').pop() || `file_${Date.now()}`);

    const path = `${downloads}/${filename}`;

    await config({
      fileCache: true,
      path,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        path,
        description: 'Downloading file...',
        mime: 'application/octet-stream',
        mediaScannable: true,
      },
    }).fetch('GET', uri);

    showAlert?.('success', t?.('downloadForms.downloadSuccess'));
  } catch (err) {
    console.error('Native download error:', err);
    showAlert?.('error', t?.('downloadForms.downloadError'));
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