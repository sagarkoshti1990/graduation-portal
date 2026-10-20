import React, { useState, useEffect } from 'react';
import { Container, VStack, Button, ButtonText, ButtonIcon, Box, Text } from '@ui';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import FilterButton from '@components/Filter';
import { useLanguage } from '@contexts/LanguageContext';
import LucideIcon from '@components/ui/LucideIcon';

// Components
import MaterialsContent from './components/MaterialsContent';

// Styles
import styles from './styles';

// Service
import { getMaterialsList, MaterialItem, MATERIAL_FORMATS } from '../../../services/serviceProvider/MaterialsLibrary/materialsLibraryService';
import {
  getSessionCategories,
  getAdditionalServiceCategories,
  getLivelihoodCategoriesOptions,
  MentoringOption,
} from '../../../services/mentoringService';

const MaterialsLibraryScreen = (): React.JSX.Element => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Record<string, any>>({});
  // A material's category is its session's category: Pillars (trainings), service categories
  // (additional services) and livelihood categories (assets)
  const [categories, setCategories] = useState<MentoringOption[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [stats, setStats] = useState({
    totalResources: 0,
    pdfDocuments: 0,
    totalDownloads: 0,
  });

  const fetchMaterials = async (currentFilters = filters) => {
    try {
      const res = await getMaterialsList({
        search: currentFilters.search,
        category: currentFilters.category,
        format: currentFilters.format,
      });
      if (res.success) {
        setMaterials(res.data);
        setStats(res.stats);
      }
    } catch (error) {
      console.error('[MaterialsLibraryScreen] Error fetching materials:', error);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [filters]);

  useEffect(() => {
    Promise.all([
      getSessionCategories().catch(() => []),
      getAdditionalServiceCategories().catch(() => []),
      // Asset filter uses livelihood_categories; 'livelihoods' holds training types, not asset categories
      getLivelihoodCategoriesOptions().catch(() => []),
    ]).then(([pillars, services, livelihoods]) => {
      const seen = new Set<string>();
      setCategories(
        [...(pillars || []), ...(services || []), ...(livelihoods || [])].filter((c) =>
          c?.value && !seen.has(c.value) ? (seen.add(c.value), true) : false,
        ),
      );
    });
  }, []);

  const categoryOptions = categories.map((category) => ({ label: category.label, value: category.value }));

  const categoryFilterOptions = [
    { label: t('supportProvider.materialsLibrary.filters.allCategories'), value: 'All' },
    ...categoryOptions,
  ];

  const formatFilterOptions = [
    { label: t('supportProvider.materialsLibrary.filters.allFormats'), value: 'All' },
    { label: t('supportProvider.materialsLibrary.formats.pdf'), value: MATERIAL_FORMATS.PDF },
    { label: t('supportProvider.materialsLibrary.formats.word'), value: MATERIAL_FORMATS.WORD },
  ];

  const filterConfigs = [
    {
      type: 'search',
      attr: 'search',
      placeholder: t('supportProvider.materialsLibrary.filters.searchPlaceholder'),
    },
    {
      type: 'select',
      attr: 'category',
      placeholder: t('supportProvider.materialsLibrary.filters.allCategories'),
      data: categoryFilterOptions,
    },
    {
      type: 'select',
      attr: 'format',
      placeholder: t('supportProvider.materialsLibrary.filters.allFormats'),
      data: formatFilterOptions,
    },
  ];

  return (
    <VStack {...styles.screenWrapper}>
      {/* Title Header */}
      <SPTitleHeader
        title={t('supportProvider.materialsLibrary.title')}
        subTitle={t('supportProvider.materialsLibrary.subtitle')}
      />

      {/* Main content body inside boxed/container layout */}
      <Container {...styles.container}>
        <VStack {...styles.contentContainer}>
          {/* 4 Stat Cards Row */}
          <Box {...styles.statsRow}>
            {/* Total Resources */}
            <Box {...styles.statCardContainer}>
              <Box {...styles.statCardContent}>
                <VStack {...styles.statTextCol}>
                  <Text {...styles.statTitleText}>
                    {t('supportProvider.materialsLibrary.stats.totalResources')}
                  </Text>
                  <Text {...styles.statCountText}>
                    {stats.totalResources}
                  </Text>
                </VStack>
                <Box {...styles.statIconBoxResources}>
                  <LucideIcon name="Folder" size={styles.statIconFolder.size} color={styles.statIconFolder.color} />
                </Box>
              </Box>
            </Box>

            {/* PDFs & Documents */}
            <Box {...styles.statCardContainer}>
              <Box {...styles.statCardContent}>
                <VStack {...styles.statTextCol}>
                  <Text {...styles.statTitleText}>
                    {t('supportProvider.materialsLibrary.stats.pdfDocuments')}
                  </Text>
                  <Text {...styles.statCountText}>
                    {stats.pdfDocuments}
                  </Text>
                </VStack>
                <Box {...styles.statIconBoxPdf}>
                  <LucideIcon name="FileText" size={styles.statIconFileText.size} color={styles.statIconFileText.color} />
                </Box>
              </Box>
            </Box>

          </Box>

          {/* Filters Box */}
          <FilterButton
            data={filterConfigs}
            onFilterChange={setFilters}
            showClearButton={false}
            hideTitleHeader={true}
            _container={styles.filterBoxContainerProps}
          />

          {/* Remaining Page Content */}
          <MaterialsContent
            materials={materials}
            fetchMaterials={fetchMaterials}
            isUploadOpen={isUploadOpen}
            onUploadClose={() => setIsUploadOpen(false)}
            categoryOptions={categoryOptions}
          />
        </VStack>
      </Container>
    </VStack>
  );
};

export default MaterialsLibraryScreen;
