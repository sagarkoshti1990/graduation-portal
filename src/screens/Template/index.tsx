import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScrollView,
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  LucideIcon,
  Button,
  ButtonText,
  Container,
} from '@ui';
import { useRoute, useNavigation } from '@react-navigation/native';
import Modal from '@components/ui/Modal';
import { profileStyles } from '@components/ui/Modal/Styles';
import Select from '@components/ui/Inputs/Select';
import templateStyles from './styles';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { theme } from '@config/theme';
import { createOrUpdateProgramUserMapping, getParticipantById, getParticipantsList , updateEntityDetails} from '../../services/participantService';
import {
  getProjectCategoryList,
} from '../../services/projectService';
import { usePlatform } from '@utils/platform';
import { useLanguage } from '@contexts/LanguageContext';
import ProjectPlayer from '../ProjectPlayer/index';
import {
  MODE,
  PROJECT_PLAYER_CONFIGS,
} from '@constants/PROJECTDATA';
import { ProjectPlayerData } from 'src/project-player/types/components.types';
import { getCategoryList, getProjectDetails} from '../../project-player/services/projectPlayerService';
import { useAuth } from '@contexts/AuthContext';
import { STATUS, PATHWAY_TAGS } from '@constants/app.constant';
import { Category, PillarCategoryMap, PillarSelection, SubCategory } from '@app-types/screens';
import logger from '@utils/logger';

const DevelopInterventionPlan: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const { user } = useAuth();

  const participantId = (route.params as { id?: string })?.id || '';

  /* -------------------- STATE -------------------- */
  const [templates, setTemplates] = useState<any[]>([]);
  const [pillarCategoryMap, setPillarCategoryMap] = useState<
    PillarCategoryMap[]
  >([]);

  const [pillarData, setPillarData] = useState<any[]>([]);
  const [pillarIdsToGetIdp, setPillarIdsToGetIdp] = useState<any[]>([]);
  const [selectionByPillar, setSelectionByPillar] = useState<
    Record<string, PillarSelection>
  >({});

  const [participant, setParticipant] = useState<any>(null);
  const [selectedPathway, setSelectedPathway] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showProjectPlayerPreview, setShowProjectPlayerPreview] =
    useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [idpCreated, setIdpCreated] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* -------------------- DERIVED -------------------- */
  const participantName = participant?.name || '-';

    useEffect(() => {
      const fetchEntityDetails = async () => {
        if (participantId && user?.id) {
          try {
            const response = await getParticipantsList({entityId:participantId,userId:user?.id})
            const {userDetails,...rest} = response?.result?.data?.[0]
            const participantData = {...(userDetails || {}),...rest}
            setParticipant(participantData);
          } catch (err) {
            logger.log(err);
          }
        }
      };
      fetchEntityDetails();
    }, [participantId,user?.id, idpCreated]);

  const getCategoriesForPillar = (pillarId: string) =>
    pillarCategoryMap.find(p => p.pillarId === pillarId)?.categories || [];

  const getSubCategoriesForPillar = (pillarId: string) => {
    const pillarCategoryId = selectionByPillar[pillarId]?.categoryId;
    if (!pillarCategoryId) {
      return [];
    }
    const categories = getCategoriesForPillar(pillarId);
    const selectedCategory = categories.find(c => c.id === pillarCategoryId);
    return selectedCategory?.subcategories || [];
  };

  const handleIdpCreation = useCallback(async (newProjectId: any) => {
    logger.log('handleIdpCreation -  Project ID:', newProjectId);
    setIdpCreated(true);
    if (newProjectId) {
      // Extract project ID from the response
      setProjectId(projectId);


      const response = await getProjectDetails(newProjectId);
      const project = response?.data;
      // update entity to IN_PROGRESS
      await updateEntityDetails({
        userId: user?.userId,
        entityId: participantId,
        entityUpdates: {
          idpProjectId: newProjectId,
          status: STATUS.IN_PROGRESS,
        },
      });

     // create user program Mapping for the participant
      await createOrUpdateProgramUserMapping({
        userId: participantId,
        programId: project.programId,
        metaInformation: {
          idpProjectId: newProjectId,
        },
        status: STATUS.IN_PROGRESS
      });

      // await updateEntityDetails({
      //   userId: participantId,
      //   entityId: participantId,
      //   entityUpdates: {
      //     status: STATUS.IN_PROGRESS,
      //   },
      // });
    // @ts-ignore - Navigation type issue
    navigation.navigate('participant-detail', { id: route.params?.id });
    }
  }, [navigation, participantId, projectId, route, user?.userId]);

  const handleChangePathway = useCallback(() => {
    setShowProjectPlayerPreview(false);
    setIsModalOpen(false);
    setSelectedPathway('');
    setPillarData([]);
    setPillarIdsToGetIdp([]);
    setSelectionByPillar({});
    setPillarCategoryMap([]);
  }, []);

  const getPillarCategoryRelationships = useMemo(() => {
    // Get all pillars that have child categories from pillarData
    const pillarsWithCategories = pillarData.filter(
      (pillar: any) => pillar?.hasChildCategories,
    );

    return pillarsWithCategories
      .map((pillar: any) => {
        const pillarId = pillar._id;
        const selection = selectionByPillar[pillarId];

        if (!selection) {
          return null; // No selection made for this pillar
        }

        // Check if subcategory is selected
        if (selection.subCategoryId) {
          return {
            pillarId: pillarId,
            pillarName: pillar.name,
            selectedCategoryId: selection.subCategoryId,
            type: 'subcategory' as const,
          };
        }

        // If no subcategory but category is selected, check if category has subcategories
        if (selection.categoryId) {
          // Get categories for this pillar directly from pillarCategoryMap
          const pillarCategoryData = pillarCategoryMap.find(
            p => p.pillarId === pillarId,
          );
          const categories = pillarCategoryData?.categories || [];
          const selectedCategory = categories.find(
            c => c.id === selection.categoryId,
          );
          
          if (selectedCategory && !selectedCategory.hasChildren) {
            return {
              pillarId: pillarId,
              pillarName: pillar.name,
              selectedCategoryId: selection.categoryId,
              type: 'category' as const,
            };
          }
        }

        return null; // Incomplete selection (category selected but subcategory pending)
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [pillarData, selectionByPillar, pillarCategoryMap]);

  // Determine ProjectPlayer config and data based on participant status

  const config = PROJECT_PLAYER_CONFIGS;
  const selectedMode = participant?.status === STATUS.IN_PROGRESS ? MODE.editMode : MODE.previewMode;

    
  const configData = {
    ...config,
    ...selectedMode,
    profileInfo: participant,
    showAddCustomTaskButton: true,
    showSubmitButton: true,
    onSubmitInterventionPlan: handleIdpCreation,
    onChangePathway: handleChangePathway,
  };




  // Combine pillarIdsToGetIdp with selected subcategory IDs
  const categoryIdsArray = useMemo(() => {
    const selectedSubCategoryIds = Object.values(selectionByPillar)
      .map(selection => selection.subCategoryId)
      .filter((id): id is string => Boolean(id)); // Filter out empty strings/undefined

    // Combine pillar IDs without categories + selected subcategory IDs
    return [...pillarIdsToGetIdp, ...selectedSubCategoryIds];
  }, [pillarIdsToGetIdp, selectionByPillar]);

  const ProjectPlayerConfigData: ProjectPlayerData = useMemo(
    () => ({
      projectId: projectId || participant?.idpProjectId,
      categoryIds: categoryIdsArray, 
      selectedPathway: selectedPathway,
      pillarCategoryRelation: getPillarCategoryRelationships,
    }),
    [
      categoryIdsArray,
      projectId,
      selectedPathway,
      getPillarCategoryRelationships,
      participant?.idpProjectId
    ],
  );

  /* -------------------- EFFECTS -------------------- */

  // Fetch participant (runs once when id is available)
  useEffect(() => {
    if (!participantId) return;

    const data = getParticipantById(participantId);
    setParticipant(data);
  }, [participantId]);

  // Fetch templates & categories (RUNS ONLY ONCE)
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // const templatesData = await getProjectTemplates();
        const templatesData = await getProjectCategoryList();

        if (!isMounted) return;
        setTemplates(templatesData || []);
      } catch (err) {
        logger.error('Failed to fetch project data', err);
        if (isMounted) {
          setError('Failed to load templates');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  /* -------------------- HANDLERS -------------------- */

  const handleConfirm = () => {
    // Check if all pillars with child categories have both category and subcategory selected
    const allPillarsHaveSelections = pillarData
      .filter((pillar: any) => pillar?.hasChildCategories)
      .every(
        (pillar: any) =>
          selectionByPillar[pillar._id]?.categoryId &&
          selectionByPillar[pillar._id]?.subCategoryId,
      );

    if (allPillarsHaveSelections) {
      // Log the pillar-category relationships
      logger.log(
        'Pillar-Category Relationships:',
        getPillarCategoryRelationships,
      );

      setIsModalOpen(false);
      setShowProjectPlayerPreview(true);
    }
  };

  const handlePathwaySelection = async (id: string) => {
    try {
      setSelectedPathway(id);
      const res = await getCategoryList(id);
      const pillars = res?.data ?? [];
      setPillarData(pillars);

      const pillarIdsWithCategories = pillars
        .filter((pillar: any) => pillar?.hasChildCategories)
        .map((pillar: any) => pillar._id);

      const pillarIdsWithoutCategories = pillars
        .filter((pillar: any) => pillar?.hasChildCategories === false)
        .map((pillar: any) => pillar._id);
      setPillarIdsToGetIdp(pillarIdsWithoutCategories);

      // If no pillars have child categories, skip modal and directly show project player
      if (pillarIdsWithCategories.length === 0) {
        setShowProjectPlayerPreview(true);
        return;
      }

      // If pillars have child categories, show modal and fetch category hierarchy
      setIsModalOpen(true);

      const pillarCategoryHierarchy: PillarCategoryMap[] = await Promise.all(
        pillarIdsWithCategories.map(async (pillarId:any) => {
          // 1️⃣ categories under pillar
          const categoryList = await getCategoryList(pillarId);
          // const categoryList = categoryDetailsMockData.result;

          // 2️⃣ categories + subcategories
          const categories: Category[] = await Promise.all(
            categoryList.data.map(async (category: any) => {
              let subcategories: SubCategory[] = [];

              if (category?.hasChildCategories) {
                const subCategoryList = await getCategoryList(category._id);
                // const subCategoryList = subCategoryDetailsMockData.result;
                subcategories = Array.isArray(subCategoryList?.data)
                  ? subCategoryList.data.map((sc: any) => ({
                      id: sc?._id ?? '',
                      label: sc?.name ?? '',
                    }))
                  : [];
              }

              return {
                id: category._id,
                label: category.name,
                hasChildren: category.hasChildCategories,
                subcategories,
              };
            }),
          );

          return {
            pillarId,
            categories,
          };
        }),
      );

      setPillarCategoryMap(pillarCategoryHierarchy);

      // setCategories(categoriesData || []);
    } catch (err) {
      logger.error('Failed to fetch project data', err);
      setError('Failed to load templates');
    }
  };

  const handleBackPress = () => {
    // @ts-ignore - Navigation type issue
    navigation.navigate('participant-detail', { id: participantId });
    setShowProjectPlayerPreview(false);
  };

  const handleViewCheckIns = () => {
    // @ts-ignore - Navigation type issue
    navigation.navigate('log-visit', { id: participantId });
  };

  /* -------------------- UI -------------------- */

  return (
    <VStack flex={1} h="100vh" maxHeight="100vh" overflow="hidden" {...(templateStyles.container as any)}>
      {/* Header */}
      <Box flexShrink={0} {...(templateStyles.headerContainer as any)}>
        <Box {...(templateStyles.contentContainer as any)}>
          <HStack {...(templateStyles.navigationRow as any)}>
            <Pressable onPress={handleBackPress}>
              <HStack {...(templateStyles.backLinkContainer as any)}>
                <LucideIcon
                  name="ArrowLeft"
                  size={20}
                  color={theme.tokens.colors.textPrimary}
                />
                <Text {...(templateStyles.backLinkText as any)}>
                  {t('template.backButton')}
                </Text>
              </HStack>
            </Pressable>

            <Pressable onPress={handleViewCheckIns}>
              <Box {...(templateStyles.viewCheckInsButton as any)}>
                <LucideIcon name="History" size={16} />
                <Text {...(templateStyles.viewCheckInsButtonText as any)}>
                  {t('logVisit.viewCheckIns')}
                </Text>
              </Box>
            </Pressable>
          </HStack>

          <VStack {...(templateStyles.headerContent as any)}>
            <Text {...(templateStyles.pageTitle as any)}>
              {t('template.pageTitle')}
            </Text>
            <Text {...(templateStyles.pageSubtitle as any)}>
              {t('template.pageSubtitle', { name: participantName })}
            </Text>
          </VStack>
        </Box>
      </Box>

      <Container flex={1} {...(templateStyles.mainContent as any)}>
        {/* Loading */}
        {isLoading && (
          <Box py="$10" alignItems="center">
            <Text>{t('common.loading')}</Text>
          </Box>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Box py="$10" alignItems="center">
            <Text color="$error500">{error}</Text>
          </Box>
        )}

        {/* Templates */}
        {!isLoading &&
          !error &&
          !showProjectPlayerPreview && (
        <ScrollView flex={1} contentContainerStyle={templateStyles.scrollViewContent} showsVerticalScrollIndicator={false}>
          {templates?.map(pathway => (
            <Pressable
              key={pathway?._id}
              {...(templateStyles.pressableCard as any)}
              // onPress={handleCategorySelection()}
              onPress={() => handlePathwaySelection(pathway._id)}
            >
              <HStack space="md" alignItems="flex-start">
                <Box
                  {...(templateStyles.iconBox as any)}
                  {...(templateStyles.iconContainer as any)}
                >
                  <LucideIcon
                    name="FileText"
                    size={25}
                    color={theme.tokens.colors.gray600}
                  />
                </Box>
                <VStack flex={1} space="xs">
                  <Text {...TYPOGRAPHY.h3} color="$textLight900" fontWeight="$normal">
                    {pathway.name}
                  </Text>
                  <Text
                    {...TYPOGRAPHY.bodySmall}
                    color="$textMutedForeground"
                    lineHeight="$lg"
                  >
                    {pathway.description}
                  </Text>
                  <HStack
                    space="sm"
                    alignItems="center"
                    flexWrap="wrap"
                    mt="$2"
                  >
                    <Box
                      {...(templateStyles.badge as any)}
                      bg={
                        String(pathway.metaInformation?.tags || '')
                          .toLowerCase()
                          .includes(PATHWAY_TAGS.ENTREPRENEURSHIP.toLowerCase())
                          ? '$badgeSuccessBg'
                          : '$badgeInfoBg'
                      }
                    >
                      <Text
                        {...TYPOGRAPHY.caption}
                        fontWeight="$medium"
                        color={
                          String(pathway.metaInformation?.tags || '')
                            .toLowerCase()
                            .includes(PATHWAY_TAGS.ENTREPRENEURSHIP.toLowerCase())
                            ? '$badgeSuccessText'
                            : '$badgeInfoText'
                        }
                      >
                        {pathway.metaInformation?.tags || ''}
                      </Text>
                    </Box>
                    <Text
                      {...TYPOGRAPHY.caption}
                      color="$textMutedForeground"
                      mr="$2"
                    >
                      {pathway?.children.length}{' '}
                      {t('template.pathwayCard.pillars')}
                    </Text>
                  </HStack>
                  <Box {...(templateStyles.pillarsSection as any)}>
                    <Text {...TYPOGRAPHY.label} color="$textLight900" mb="$2">
                      {t('template.pathwayCard.includedPillars')}
                    </Text>
                    <VStack>
                      {pathway?.children?.map(
                        (
                          pillar: { name: string; tasks: number },
                          index: number,
                        ) => (
                          <Text
                            key={index}
                            {...TYPOGRAPHY.bodySmall}
                            color="$textMutedForeground"
                            mb="$1"
                          >
                            <Text color="$hoverBorder" mr="$2">
                              •{' '}
                            </Text>
                            {pillar.name}
                            {/* ({pillar.tasks}{' '}
                            {t('template.pathwayCard.tasksLabel')}) */}
                          </Text>
                        ),
                      )}
                    </VStack>
                  </Box>
                </VStack>
              </HStack>
            </Pressable>
          ))}
        </ScrollView>
      )}

        {!isLoading && !error && showProjectPlayerPreview && (
        <Box flex={1} h="100%" overflow="hidden">
          <ProjectPlayer config={configData} data={ProjectPlayerConfigData} />
          </Box>
        )}
      </Container>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size={isMobile ? "lg" : "md"}
        headerTitle={t('template.categoryModal.title')}
        headerDescription={t('template.categoryModal.forParticipant', {
          name: participantName,
        })}
        headerIcon={
          <Box {...(templateStyles.modalHeaderIcon as any)}>
            <LucideIcon
              name="Briefcase"
              size={20}
              color={theme.tokens.colors.primary500}
            />
          </Box>
        }
        footerContent={
          <Box {...(templateStyles.modalFooter as any)}>
            <Button
              {...profileStyles.cancelButton}
              width="$full"
              sx={{
                '@md': {
                  width: 'auto',
                },
              }}
              onPress={() => setIsModalOpen(false)}
            >
              <ButtonText
                color={theme.tokens.colors.textPrimary}
                {...TYPOGRAPHY.button}
              >
                {t('template.categoryModal.cancelButton')}
              </ButtonText>
            </Button>
            <Button
              {...profileStyles.confirmButton}
              variant={'solid'}
              width="$full"
              sx={{
                '@md': {
                  width: 'auto',
                },
              }}
              onPress={handleConfirm}
              isDisabled={
                !pillarData
                  .filter((pillar: any) => pillar?.hasChildCategories)
                  .every(
                    (pillar: any) =>
                      selectionByPillar[pillar._id]?.categoryId &&
                      selectionByPillar[pillar._id]?.subCategoryId,
                  )
              }
            >
              <ButtonText
                color={theme.tokens.colors.modalBackground}
                {...TYPOGRAPHY.button}
              >
                {t('template.categoryModal.confirmButton')}
              </ButtonText>
            </Button>
          </Box>
        }
        //size={isWeb ? 'md' : 'lg'}
      >
        <VStack gap="$1">
          <Text {...TYPOGRAPHY.bodySmall} color="$textSecondary" mb="$2">
            {t('template.categoryModal.description')}
          </Text>
          {pillarData?.map((pillar: any) =>
            pillar?.hasChildCategories ? (
              <React.Fragment key={pillar._id}>
                <VStack gap="$1" mb="$2">
                  <Text {...TYPOGRAPHY.label} color="$textPrimary">
                    {/* {t('template.categoryModal.categoryLabel')} */}
                    Category of {pillar?.name}
                  </Text>
                 <Box {...(templateStyles.selectWrapper as any)}>
                  <Select
                    options={getCategoriesForPillar(pillar._id).map(c => ({
                      label: c.label,
                      value: c.id,
                    }))}
                    value={selectionByPillar[pillar._id]?.categoryId || ''}
                    onChange={value => {
                      const selectedCategory = getCategoriesForPillar(
                        pillar._id,
                      ).find(c => c.id === value);
                      setSelectionByPillar(prev => ({
                        ...prev,
                        [pillar._id]: {
                          categoryId: value,
                          categoryName: selectedCategory?.label || '',
                          subCategoryId: '', // reset
                          subCategoryName: '', // reset
                        },
                      }));
                    }}
                    placeholder={t(
                      'template.categoryModal.categoryPlaceholder',
                    )}
                    borderColor="$transparent"
                  />
                  </Box>
                </VStack>

                <VStack gap="$1" mb="$1">
                  <Text {...TYPOGRAPHY.label} color="$textPrimary">
                    {/* {t('template.categoryModal.subCategoryLabel')} */}
                    Sub-Category of {pillar?.name}
                  </Text>

                  <Box
                    opacity={
                      !selectionByPillar[pillar._id]?.categoryId ? 0.5 : 1
                    }
                    pointerEvents={
                      !selectionByPillar[pillar._id]?.categoryId
                        ? 'none'
                        : 'auto'
                    }
                  >
                    <Box {...(templateStyles.selectWrapper as any)}>
                    <Select
                      key={`subcategory-${pillar._id}-${
                        selectionByPillar[pillar._id]?.categoryId || 'none'
                      }`}
                      options={getSubCategoriesForPillar(pillar._id).map(
                        sc => ({
                          label: sc.label,
                          value: sc.id,
                        }),
                      )}
                      value={selectionByPillar[pillar._id]?.subCategoryId || ''}
                      onChange={value => {
                        const selectedSubCategory = getSubCategoriesForPillar(
                          pillar._id,
                        ).find(sc => sc.id === value);
                        setSelectionByPillar(prev => ({
                          ...prev,
                          [pillar._id]: {
                            ...prev[pillar._id],
                            subCategoryId: value,
                            subCategoryName: selectedSubCategory?.label || '',
                          },
                        }));
                      }}
                      placeholder={t(
                        'template.categoryModal.subCategoryPlaceholder',
                      )}
                      borderColor="$transparent"
                    />
                    </Box>
                  </Box>
                </VStack>
              </React.Fragment>
            ) : null,
          )}
          {/* Selected summary - blue info box */}
          {pillarData
            .filter((pillar: any) => pillar?.hasChildCategories)
            .every(
              (pillar: any) =>
                selectionByPillar[pillar._id]?.categoryId &&
                selectionByPillar[pillar._id]?.subCategoryId,
            ) && (
            <Box {...(templateStyles.summaryBox as any)}>
              {pillarData
                .filter((pillar: any) => pillar?.hasChildCategories)
                .map((pillar: any) => {
                  const selection = selectionByPillar[pillar._id];

                  if (!selection?.categoryId || !selection?.subCategoryId) {
                    return null;
                  }
                                     
                  return (
                    <React.Fragment key={pillar._id}>
                      <Text
                        key={pillar._id}
                        {...TYPOGRAPHY.bodySmall}
                        color="$blue800"
                        fontWeight="$semibold"
                        mb="$1"
                      >
                        {t('template.categoryModal.selectedLabel', {
                          category: selection.categoryName,
                          subcategory: selection.subCategoryName,
                        })}
                      </Text>
                      <Text
                        {...TYPOGRAPHY.caption}
                        color="$blue700"
                      >
                        {t('template.categoryModal.selectedDescription')}
                      </Text>
                    </React.Fragment>
                  );
                })}
            </Box>
          )}
        </VStack>
      </Modal>
    </VStack>
  );
};

export default DevelopInterventionPlan;
