import {Linking, Image, Platform} from "react-native"
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


export const openDownload = (assetSource: number | string,t?:any, showAlert?: any) => {
  const uri =
    typeof assetSource === 'string'
      ? assetSource
      : Image.resolveAssetSource(assetSource)?.uri;
  
  if (!uri) {
    console.error('Download failed: URI is undefined');
    showAlert?.('error', t('downloadForms.downloadUriError'));
    return;
  }
  
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      // For web, we need to handle the URL properly
      // If the URI starts with /, it's a relative path on our server
      const downloadUrl = uri.startsWith('/') 
        ? uri 
        : uri;
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Extract filename from URI and decode it
      const pathParts = downloadUrl.split('/');
      const filename = pathParts[pathParts.length - 1] || 'download';
      link.download = decodeURIComponent(filename);
      
      // Set target to avoid navigation issues
      link.target = '_blank';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download initiated successfully for:', filename);
      showAlert?.('success', t('downloadForms.downloadSuccess'));
    } catch (error) {
      console.error('Download error:', error);
      showAlert?.('error', t('downloadForms.downloadError'));
      // Fallback: open in new tab
      window.open(uri, '_blank');
    }
    return;
  }
  
  // Native platforms
  Linking.openURL(uri)
    .then(() => {
      showAlert?.('success', t?.('downloadForms.downloadSuccess'));
    })
    .catch(err => {
      console.error('Failed to open URL:', err);
      showAlert?.('error', t?.('downloadForms.downloadError'));
    });
};