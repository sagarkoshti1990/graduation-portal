import {
  getResourcesList,
  getSessionCategories,
  getAdditionalServiceCategories,
  getLivelihoodsOptions,
  getLivelihoodCategoriesOptions,
  MentoringOption,
} from '../../mentoringService';

// Only PDF and Word documents are supported in the Materials Library
export const MATERIAL_FORMATS = {
  PDF: 'PDF Document',
  WORD: 'Word Document',
} as const;

export const ALLOWED_MATERIAL_EXTENSIONS = ['pdf', 'doc', 'docx'];

/** Maps a resource's type / file name to one of MATERIAL_FORMATS ('' for any other file type) */
export const getMaterialFormat = (type: string, fileName: string): string => {
  const ext = (fileName.includes('.') ? fileName.split('.').pop() : '')?.toLowerCase() || '';
  const kind = (type || '').toLowerCase();
  if (kind === 'pdf' || ext === 'pdf') return MATERIAL_FORMATS.PDF;
  if (['doc', 'docx', 'msword'].includes(kind) || kind.includes('wordprocessingml') || ['doc', 'docx'].includes(ext)) {
    return MATERIAL_FORMATS.WORD;
  }
  return '';
};

export interface MaterialItem {
  id: string;
  title: string;
  description: string;
  category: string;
  /** Raw category value (e.g. 'social_empowerment') from the linked session, used for exact filtering */
  categoryValue?: string;
  format: string;
  fileName: string;
  fileSize: string;
  associatedOffering: string;
  uploadDate: string;
  downloads: number;
  fileUrl?: string;
}

export interface MaterialsFilterParams {
  search?: string;
  category?: string;
  format?: string;
}

export interface MaterialsLibraryResponse {
  success: boolean;
  data: MaterialItem[];
  stats: {
    totalResources: number;
    pdfDocuments: number;
    totalDownloads: number;
  };
}

// In-memory data store for session state
let inMemoryMaterials: MaterialItem[] = [];

/**
 * Get materials with optional filters, search, and dynamic stats from backend API
 */
export const getMaterialsList = async (
  params?: MaterialsFilterParams
): Promise<MaterialsLibraryResponse> => {
  const { search, category, format } = params || {};

  let items: MaterialItem[] = [];

  try {
    // A resource's category is its linked session's category (Pillar for trainings, service category
    // for additional services, livelihood category for assets); the entity lists turn values into labels.
    // livelihoods is kept only to label older assets saved before livelihood_categories existed
    const [apiRes, sessionCategories, serviceCategories, livelihoods, livelihoodCategories] = await Promise.all([
      getResourcesList(),
      getSessionCategories().catch(() => [] as MentoringOption[]),
      getAdditionalServiceCategories().catch(() => [] as MentoringOption[]),
      getLivelihoodsOptions().catch(() => [] as MentoringOption[]),
      getLivelihoodCategoriesOptions().catch(() => [] as MentoringOption[]),
    ]);
    const rawResources = apiRes?.result || [];
    const categoryLabels = new Map<string, string>(
      [
        ...(sessionCategories || []),
        ...(serviceCategories || []),
        ...(livelihoods || []),
        ...(livelihoodCategories || []),
      ].map((c) => [c.value, c.label]),
    );

    if (Array.isArray(rawResources) && rawResources.length > 0) {
      items = rawResources.map((resource: any) => {
        const fileName = resource.name || `resource-${resource.id}`;
        const session = resource.session || {};
        // Asset sessions always have categories ['asset']; their real category is meta.livelihood_categories (older ones: meta.livelihoods)
        const isAsset = session.meta?.support_offering_type === 'asset' || session.categories?.[0] === 'asset';
        const assetCategory = session.meta?.livelihood_categories ?? session.meta?.livelihoods;
        const categoryValue: string = (isAsset ? assetCategory : session.categories?.[0]) || '';

        return {
          id: String(resource.id),
          title: fileName,
          // Resources have no description of their own; show the linked session's
          description: session.description || '',
          category: categoryLabels.get(categoryValue) || categoryValue,
          categoryValue,
          format: getMaterialFormat(resource.type, fileName),
          fileName,
          fileSize: '',
          associatedOffering: resource.session?.title || '',
          uploadDate: resource.created_at ? new Date(resource.created_at).toLocaleDateString('en-GB') : '',
          downloads: 0,      
          fileUrl: resource.link || '',
        };
      });
    }
  } catch (err) {
    console.warn('[materialsLibraryService] Failed to fetch resources list:', err);
  }

  let filtered = [...items];

  // Apply search (matching title, description, or associated offering)
  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.associatedOffering.toLowerCase().includes(q)
    );
  }

  // Apply category filter (skip if it contains 'all')
  // Exact match on the category value; the label comparison covers locally added items that only have a label.
  // (The old substring check matched every item without a category, so the filter never narrowed anything.)
  if (category && !category.toLowerCase().includes('all')) {
    const normalize = (value: string) => value.toLowerCase().replace(/[\s-_]/g, '');
    const targetCat = normalize(category);
    filtered = filtered.filter((item) => {
      if (item.categoryValue) return item.categoryValue === category;
      const itemCat = normalize(item.category);
      return itemCat !== '' && itemCat === targetCat;
    });
  }

  // Apply format filter (skip if it contains 'all')
  if (format && !format.toLowerCase().includes('all')) {
    const targetForm = format.toLowerCase().replace(/[\s-_]/g, '');
    filtered = filtered.filter((item) => {
      const itemForm = item.format.toLowerCase().replace(/[\s-_]/g, '');
      return itemForm === targetForm;
    });
  }

  // Compute stats on the complete set (unfiltered)
  const totalResources = items.length;
  // "PDFs & Word Documents" stat card counts both supported formats
  const pdfDocuments = items.filter(
    (item) => item.format === MATERIAL_FORMATS.PDF || item.format === MATERIAL_FORMATS.WORD
  ).length;
  const totalDownloads = items.reduce((acc, item) => acc + item.downloads, 0);

  return {
    success: true,
    data: filtered,
    stats: {
      totalResources,
      pdfDocuments,
      totalDownloads,
    },
  };
};

/**
 * Upload a new resource material
 */
export const uploadMaterial = async (
  payload: Omit<MaterialItem, 'id' | 'uploadDate' | 'downloads' | 'fileSize'>
): Promise<{ success: boolean; data: MaterialItem; message: string }> => {
  // Simple validation
  if (!payload.title || !payload.description || !payload.category || !payload.format) {
    throw new Error('Required fields are missing');
  }

  // Generate today's date formatted as DD/MM/YYYY
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  const newMaterial: MaterialItem = {
    ...payload,
    id: String(Date.now()),
    fileSize: payload.format === MATERIAL_FORMATS.PDF ? '2.1 MB' : '1.5 MB', // placeholder size
    uploadDate: formattedDate,
    downloads: 0,
  };

  inMemoryMaterials = [newMaterial, ...inMemoryMaterials];

  return {
    success: true,
    data: newMaterial,
    message: 'Resource uploaded successfully!',
  };
};

/**
 * Delete a resource material
 */
export const deleteMaterial = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  inMemoryMaterials = inMemoryMaterials.filter((item) => item.id !== id);
  return {
    success: true,
    message: 'Resource deleted successfully!',
  };
};

/**
 * Download resource (simulated downloads increment)
 */
export const incrementDownloads = async (
  id: string
): Promise<{ success: boolean; downloads: number }> => {
  let updatedDownloads = 0;
  inMemoryMaterials = inMemoryMaterials.map((item) => {
    if (item.id === id) {
      updatedDownloads = item.downloads + 1;
      return { ...item, downloads: updatedDownloads };
    }
    return item;
  });

  return {
    success: true,
    downloads: updatedDownloads,
  };
};
