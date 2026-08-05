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
import { getMaterialsList, MaterialItem } from '../../../services/serviceProvider/MaterialsLibrary/materialsLibraryService';

const MaterialsLibraryScreen = (): React.JSX.Element => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [stats, setStats] = useState({
    totalResources: 0,
    pdfDocuments: 0,
    templatesDecks: 0,
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

  const categoryFilterOptions = [
    { label: t('supportProvider.materialsLibrary.filters.allCategories'), value: 'All' },
    { label: t('supportProvider.materialsLibrary.categories.financialLiteracy'), value: 'Financial Literacy' },
    { label: t('supportProvider.materialsLibrary.categories.businessManagement'), value: 'Business Management' },
    { label: t('supportProvider.materialsLibrary.categories.assetEquipment'), value: 'Asset & Equipment Support' },
    { label: t('supportProvider.materialsLibrary.categories.legalCompliance'), value: 'Legal & Compliance' },
  ];

  const formatFilterOptions = [
    { label: t('supportProvider.materialsLibrary.filters.allFormats'), value: 'All' },
    { label: t('supportProvider.materialsLibrary.formats.pdf'), value: 'PDF Document' },
    { label: t('supportProvider.materialsLibrary.formats.template'), value: 'Templates & Decks' },
    { label: t('supportProvider.materialsLibrary.formats.video'), value: 'Video Guide' },
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
    <VStack flex={1} bg="$backgroundColor">
      {/* Title Header with upload action */}
      <SPTitleHeader
        title={t('supportProvider.materialsLibrary.title')}
        subTitle={t('supportProvider.materialsLibrary.subtitle')}
        rightSection={
          <Button
            onPress={() => setIsUploadOpen(true)}
            {...styles.uploadButtonProps}
          >
            <ButtonIcon as={LucideIcon} name="Plus" />
            <ButtonText>{t('supportProvider.materialsLibrary.uploadResource')}</ButtonText>
          </Button>
        }
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
                <Box
                  {...styles.statIconBox}
                  bg="#FFF5F5"
                  borderColor="#FDE8E8"
                >
                  <LucideIcon name="Folder" size={20} color="$primary500" />
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
                <Box
                  {...styles.statIconBox}
                  bg="#EFF6FF"
                  borderColor="#DBEAFE"
                >
                  <LucideIcon name="FileText" size={20} color="$blue600" />
                </Box>
              </Box>
            </Box>

            {/* Templates & Decks */}
            <Box {...styles.statCardContainer}>
              <Box {...styles.statCardContent}>
                <VStack {...styles.statTextCol}>
                  <Text {...styles.statTitleText}>
                    {t('supportProvider.materialsLibrary.stats.templatesDecks')}
                  </Text>
                  <Text {...styles.statCountText}>
                    {stats.templatesDecks}
                  </Text>
                </VStack>
                <Box
                  {...styles.statIconBox}
                  bg="#FAF5FF"
                  borderColor="#E9D5FF"
                >
                  <LucideIcon name="TrendingUp" size={20} color="$purple600" />
                </Box>
              </Box>
            </Box>

            {/* Total Downloads */}
            <Box {...styles.statCardContainer}>
              <Box {...styles.statCardContent}>
                <VStack {...styles.statTextCol}>
                  <Text {...styles.statTitleText}>
                    {t('supportProvider.materialsLibrary.stats.totalDownloads')}
                  </Text>
                  <Text {...styles.statCountText}>
                    {stats.totalDownloads}
                  </Text>
                </VStack>
                <Box
                  {...styles.statIconBox}
                  bg="#F0FDF4"
                  borderColor="#DCFCE7"
                >
                  <LucideIcon name="Download" size={20} color="$success600" />
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
          />
        </VStack>
      </Container>
    </VStack>
  );
};

export default MaterialsLibraryScreen;
