import mockMaterials from './mockData/materialsLibrary.json';

export interface MaterialItem {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  fileName: string;
  fileSize: string;
  associatedOffering: string;
  uploadDate: string;
  downloads: number;
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
    templatesDecks: number;
    totalDownloads: number;
  };
}

// In-memory data store for mock state session
let inMemoryMaterials: MaterialItem[] = [...(mockMaterials as unknown as MaterialItem[])];

/**
 * Get materials with optional filters, search, and dynamic stats
 */
export const getMaterialsList = async (
  params?: MaterialsFilterParams
): Promise<MaterialsLibraryResponse> => {
  const { search, category, format } = params || {};

  let filtered = [...inMemoryMaterials];

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
  if (category && !category.toLowerCase().includes('all')) {
    const targetCat = category.toLowerCase().replace(/[\s-_]/g, '');
    filtered = filtered.filter((item) => {
      const itemCat = item.category.toLowerCase().replace(/[\s-_]/g, '');
      return itemCat === targetCat || itemCat.includes(targetCat) || targetCat.includes(itemCat);
    });
  }

  // Apply format filter (skip if it contains 'all')
  if (format && !format.toLowerCase().includes('all')) {
    const targetForm = format.toLowerCase().replace(/[\s-_]/g, '');
    filtered = filtered.filter((item) => {
      const itemForm = item.format.toLowerCase().replace(/[\s-_]/g, '');
      return itemForm === targetForm || itemForm.includes(targetForm) || targetForm.includes(itemForm);
    });
  }

  // Compute stats on the complete set (unfiltered)
  const totalResources = inMemoryMaterials.length;
  
  // Format categorization:
  // PDFs & Documents includes: PDF Document
  // Templates & Decks includes: Templates & Decks
  const pdfDocuments = inMemoryMaterials.filter(
    (item) => item.format.toLowerCase() === 'pdf document'
  ).length;

  const templatesDecks = inMemoryMaterials.filter(
    (item) => item.format.toLowerCase() === 'templates & decks'
  ).length;

  const totalDownloads = inMemoryMaterials.reduce((acc, item) => acc + item.downloads, 0);

  return {
    success: true,
    data: filtered,
    stats: {
      totalResources,
      pdfDocuments,
      templatesDecks,
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
    fileSize: payload.format === 'PDF Document' ? '2.1 MB' : '1.5 MB', // placeholder size
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
