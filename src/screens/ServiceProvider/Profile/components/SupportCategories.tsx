import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VStack, HStack, Text, Box, Button, ButtonText, ButtonIcon, Badge, BadgeText, Pressable, Input, InputField } from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import styles from '../styles';
import {
  getSupportCategories,
  getSocialEmpowermentOptions,
  getFinancialInclusionOptions,
  getLivelihoodsOptions,
  getSpecialAttentionOptions,
  getImmediateAttentionOptions,
  getAssetTypesOptions,
} from '../../../../services/mentoringService';

import { SUPPORT_CATEGORIES } from '@constants/SUPPORT_PROVIDER_CARDS';

// Sub-option entries can be plain ids (freshly selected from the <Select>) or
// full { value, label } option objects (as returned by the mentoring API).
export type OptionValue = string | { value: string; label: string };

export interface SupportCategoryItem {
  id: string;
  categoryName: string;
  trainingData?: {
    socialEmpowerment: OptionValue[];
    financialInclusion: OptionValue[];
    livelihoods: OptionValue[];
  };
  linkageData?: {
    specialAttention: OptionValue[];
    immediateAttention: OptionValue[];
  };
  assetsData?: {
    assetTypes: OptionValue[];
  };
  othersData?: string;
}

interface SupportCategoriesProps {
  value: SupportCategoryItem[];
  onChange: (value: SupportCategoryItem[]) => void;
  mode: 'preview' | 'edit';
  t: any;
}

export const isTrainingCategory = (cat?: string) => {
  return cat === SUPPORT_CATEGORIES.TRAINING;
};

export const isLinkageCategory = (cat?: string) => {
  return cat === SUPPORT_CATEGORIES.ADDITIONAL_SERVICE;
};

export const isAssetCategory = (cat?: string) => {
  return cat === SUPPORT_CATEGORIES.ASSET;
};

  // Dynamic Options fetched directly from API/DB, grouped into a single state object
  type OptionItem = { value: string; label: string };
  interface CategoryOptionsState {
    categoryOpts: OptionItem[];
    socialEmpowermentOpts: OptionItem[];
    financialInclusionOpts: OptionItem[];
    livelihoodsOpts: OptionItem[];
    specialAttentionOpts: OptionItem[];
    immediateAttentionOpts: OptionItem[];
    assetTypesOpts: OptionItem[];
  }
  
export const SupportCategories: React.FC<SupportCategoriesProps> = ({
  value = [],
  onChange,
  mode,
  t,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const initialOptionsState: CategoryOptionsState = {
    categoryOpts: [],
    socialEmpowermentOpts: [],
    financialInclusionOpts: [],
    livelihoodsOpts: [],
    specialAttentionOpts: [],
    immediateAttentionOpts: [],
    assetTypesOpts: [],
  };

  const [optionsState, setOptionsState] = useState<CategoryOptionsState>(initialOptionsState);

  // Tracks which option groups have already been fetched, so we never re-fetch the same group twice
  const fetchedGroupsRef = useRef<{ category: boolean; training: boolean; linkage: boolean; asset: boolean }>({
    category: false,
    training: false,
    linkage: false,
    asset: false,
  });

  // Fetch only the main Category (support_offering_type) list on mount - it's needed to render the select
  useEffect(() => {
    let isMounted = true;

    const fetchCategoryOptions = async () => {
      if (fetchedGroupsRef.current.category) return;
      try {
        const catRes = await getSupportCategories();
        if (!isMounted) return;
        fetchedGroupsRef.current.category = true;
        setOptionsState(prev => ({
          ...prev,
          categoryOpts: catRes || [],
        }));
      } catch (err) {
        console.error('Error fetching support categories from API:', err);
      }
    };

    fetchCategoryOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch sub-category options lazily - only when the matching category is actually selected,
  // and only once per group (cached in optionsState afterwards).
  useEffect(() => {
    if (!selectedCategory) return;
    let isMounted = true;

    const fetchTrainingOptions = async () => {
      if (fetchedGroupsRef.current.training) return;
      try {
        const [socialRes, finRes, livRes] = await Promise.all([
          getSocialEmpowermentOptions(),
          getFinancialInclusionOptions(),
          getLivelihoodsOptions(),
        ]);
        if (!isMounted) return;
        fetchedGroupsRef.current.training = true;
        setOptionsState(prev => ({
          ...prev,
          socialEmpowermentOpts: socialRes || [],
          financialInclusionOpts: finRes || [],
          livelihoodsOpts: livRes || [],
        }));
      } catch (err) {
        console.error('Error fetching training options from API:', err);
      }
    };

    const fetchLinkageOptions = async () => {
      if (fetchedGroupsRef.current.linkage) return;
      try {
        const [specRes, immRes] = await Promise.all([
          getSpecialAttentionOptions(),
          getImmediateAttentionOptions(),
        ]);
        if (!isMounted) return;
        fetchedGroupsRef.current.linkage = true;
        setOptionsState(prev => ({
          ...prev,
          specialAttentionOpts: specRes || [],
          immediateAttentionOpts: immRes || [],
        }));
      } catch (err) {
        console.error('Error fetching linkage options from API:', err);
      }
    };

    const fetchAssetOptions = async () => {
      if (fetchedGroupsRef.current.asset) return;
      try {
        const assetRes = await getAssetTypesOptions();
        if (!isMounted) return;
        fetchedGroupsRef.current.asset = true;
        setOptionsState(prev => ({
          ...prev,
          assetTypesOpts: assetRes || [],
        }));
      } catch (err) {
        console.error('Error fetching asset type options from API:', err);
      }
    };

    if (isTrainingCategory(selectedCategory)) {
      fetchTrainingOptions();
    } else if (isLinkageCategory(selectedCategory)) {
      fetchLinkageOptions();
    } else if (isAssetCategory(selectedCategory)) {
      fetchAssetOptions();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const categoryOptions = useMemo(() => {
    return optionsState.categoryOpts.filter(opt => {
      if (selectedCategory && opt.value === selectedCategory) {
        return true;
      }
      return !value.some(item => item.categoryName === opt.value);
    });
  }, [value, selectedCategory, optionsState.categoryOpts]);

  // Helper to resolve the display label for an entry that may already be a
  // full { value, label } option object, or just a plain id/label string.
  const getOptionLabel = (entry: OptionValue, optionsList: { value: string; label: string }[]) => {
    if (entry && typeof entry === 'object') {
      return entry.label ?? entry.value ?? '';
    }
    const found = optionsList.find(opt => opt.value === entry || opt.label === entry);
    return found ? found.label : entry;
  };

  // Helper to resolve the plain id/value for an entry, used for React keys
  // and for feeding the (string-based) <Select> control when editing.
  const getOptionValue = (entry: OptionValue): string => {
    return entry && typeof entry === 'object' ? entry.value : entry;
  };

  // Training state
  const [socialEmpowerment, setSocialEmpowerment] = useState<string[]>([]);
  const [financialInclusion, setFinancialInclusion] = useState<string[]>([]);
  const [livelihoods, setLivelihoods] = useState<string[]>([]);

  // Linkages state
  const [specialAttention, setSpecialAttention] = useState<string[]>([]);
  const [immediateAttention, setImmediateAttention] = useState<string[]>([]);

  // Assets state
  const [assetTypes, setAssetTypes] = useState<string[]>([]);

  // Others state
  const [othersText, setOthersText] = useState<string>('');

  const resetFormState = () => {
    setSocialEmpowerment([]);
    setFinancialInclusion([]);
    setLivelihoods([]);
    setSpecialAttention([]);
    setImmediateAttention([]);
    setAssetTypes([]);
    setOthersText('');
  };

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    const existing = value.find(item => item.categoryName === catName);
    if (existing) {
      // The <Select multiple> control works with plain ids, so unwrap any
      // { value, label } option objects back down to their id here.
      const toIds = (arr?: OptionValue[]) => (arr || []).map(getOptionValue);

      if (isTrainingCategory(catName)) {
        setSocialEmpowerment(toIds(existing.trainingData?.socialEmpowerment));
        setFinancialInclusion(toIds(existing.trainingData?.financialInclusion));
        setLivelihoods(toIds(existing.trainingData?.livelihoods));
        setSpecialAttention([]);
        setImmediateAttention([]);
        setAssetTypes([]);
        setOthersText('');
      } else if (isLinkageCategory(catName)) {
        setSpecialAttention(toIds(existing.linkageData?.specialAttention));
        setImmediateAttention(toIds(existing.linkageData?.immediateAttention));
        setSocialEmpowerment([]);
        setFinancialInclusion([]);
        setLivelihoods([]);
        setAssetTypes([]);
        setOthersText('');
      } else if (isAssetCategory(catName)) {
        setAssetTypes(toIds(existing.assetsData?.assetTypes));
        setSocialEmpowerment([]);
        setFinancialInclusion([]);
        setLivelihoods([]);
        setSpecialAttention([]);
        setImmediateAttention([]);
        setOthersText('');
      }
    } else {
      resetFormState();
    }
  };

  const handleAddCategory = () => {
    if (!selectedCategory) return;

    const existingIndex = value.findIndex(item => item.categoryName === selectedCategory);
    let nextValue = [...value];

    if (existingIndex > -1) {
      const existingItem = nextValue[existingIndex];
      const updatedItem: SupportCategoryItem = {
        id: existingItem.id,
        categoryName: selectedCategory,
      };

      if (isTrainingCategory(selectedCategory)) {
        if (socialEmpowerment.length === 0 && financialInclusion.length === 0 && livelihoods.length === 0) return;
        updatedItem.trainingData = {
          socialEmpowerment,
          financialInclusion,
          livelihoods,
        };
      } else if (isLinkageCategory(selectedCategory)) {
        if (specialAttention.length === 0 && immediateAttention.length === 0) return;
        updatedItem.linkageData = {
          specialAttention,
          immediateAttention,
        };
      } else if (isAssetCategory(selectedCategory)) {
        if (assetTypes.length === 0) return;
        updatedItem.assetsData = {
          assetTypes,
        };
      }

      nextValue[existingIndex] = updatedItem;
    } else {
      let newItem: SupportCategoryItem = {
        id: `${selectedCategory}-${Date.now()}`,
        categoryName: selectedCategory,
      };

      if (isTrainingCategory(selectedCategory)) {
        if (socialEmpowerment.length === 0 && financialInclusion.length === 0 && livelihoods.length === 0) return;
        newItem.trainingData = {
          socialEmpowerment,
          financialInclusion,
          livelihoods,
        };
      } else if (isLinkageCategory(selectedCategory)) {
        if (specialAttention.length === 0 && immediateAttention.length === 0) return;
        newItem.linkageData = {
          specialAttention,
          immediateAttention,
        };
      } else if (isAssetCategory(selectedCategory)) {
        if (assetTypes.length === 0) return;
        newItem.assetsData = {
          assetTypes,
        };
      }

      nextValue.push(newItem);
    }

    onChange(nextValue);
    setSelectedCategory('');
    resetFormState();
  };

  const handleDeleteCategory = (id: string) => {
    const deleted = value.find(item => item.id === id);
    onChange(value.filter(item => item.id !== id));
    if (deleted && deleted.categoryName === selectedCategory) {
      setSelectedCategory('');
      resetFormState();
    }
  };

  const isEdit = mode === 'edit';

  const isAddDisabled = () => {
    if (!selectedCategory) return true;
    if (isTrainingCategory(selectedCategory)) {
      return socialEmpowerment.length === 0 && financialInclusion.length === 0 && livelihoods.length === 0;
    }
    if (isLinkageCategory(selectedCategory)) {
      return specialAttention.length === 0 && immediateAttention.length === 0;
    }
    if (isAssetCategory(selectedCategory)) {
      return assetTypes.length === 0;
    }
    return true;
  };

  return (
    <VStack {...styles.coverageContainer}>
      {/* Added Category Cards */}
      <VStack {...styles.addedCardsContainer}>
        {value.length === 0 && !isEdit && (
          <Text {...styles.noCoverageText}>
            {t('profile.noSupportCategories', 'No support categories added.')}
          </Text>
        )}
        {value.map(item => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (isEdit) {
                handleSelectCategory(item.categoryName);
              }
            }}
          >
            <VStack {...styles.categoryCard}>
              <HStack {...styles.cardHeader}>
                <HStack {...styles.supportCategoryHeader}>
                  <Text {...styles.cardTitleText}>
                    {getOptionLabel(item.categoryName, optionsState.categoryOpts)}
                  </Text>
                  <Badge {...styles.offeredBadge}>
                    <BadgeText {...styles.redBadgeText}>Offered</BadgeText>
                  </Badge>
                </HStack>
                {isEdit && (
                  <HStack style={{ gap: 12, alignItems: 'center' }}>
                    <Pressable onPress={() => handleSelectCategory(item.categoryName)}>
                      <LucideIcon name="Pencil" {...styles.trashIcon} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteCategory(item.id)}>
                      <LucideIcon name="Trash2" {...styles.trashIcon} />
                    </Pressable>
                  </HStack>
                )}
              </HStack>

              {/* Render Category Details */}
              {isTrainingCategory(item.categoryName) && item.trainingData && (
                <VStack {...styles.subCategoriesContainer}>
                  <Text {...styles.specificTrainingTitle}>Specific Training Areas:</Text>

                  {item.trainingData.socialEmpowerment.length > 0 && (
                    <VStack {...styles.subCategoryCol}>
                      <Text {...styles.cardFieldLabel}>Social Empowerment Sessions</Text>
                      <HStack {...styles.badgeRow}>
                        {item.trainingData.socialEmpowerment.map((s, idx) => (
                          <Badge key={idx} {...styles.blueBadge}>
                            <BadgeText {...styles.blueBadgeText}>{getOptionLabel(s, optionsState.socialEmpowermentOpts)}</BadgeText>
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  )}

                  {item.trainingData.financialInclusion.length > 0 && (
                    <VStack {...styles.subCategoryCol}>
                      <Text {...styles.cardFieldLabel}>Financial Inclusion Sessions</Text>
                      <HStack {...styles.badgeRow}>
                        {item.trainingData.financialInclusion.map((s, idx) => (
                          <Badge key={idx} {...styles.blueBadge}>
                            <BadgeText {...styles.blueBadgeText}>{getOptionLabel(s, optionsState.financialInclusionOpts)}</BadgeText>
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  )}

                  {item.trainingData.livelihoods.length > 0 && (
                    <VStack {...styles.subCategoryCol}>
                      <Text {...styles.cardFieldLabel}>Livelihoods Sessions</Text>
                      <HStack {...styles.badgeRow}>
                        {item.trainingData.livelihoods.map((s, idx) => (
                          <Badge key={idx} {...styles.blueBadge}>
                            <BadgeText {...styles.blueBadgeText}>{getOptionLabel(s, optionsState.livelihoodsOpts)}</BadgeText>
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              )}

              {isLinkageCategory(item.categoryName) && item.linkageData && (
                <VStack {...styles.subCategoriesContainer}>
                  {item.linkageData.specialAttention.length > 0 && (
                    <VStack {...styles.subCategoryCol}>
                      <Text {...styles.cardFieldLabel}>Special Attention Tags</Text>
                      <HStack {...styles.badgeRow}>
                        {item.linkageData.specialAttention.map((s, idx) => (
                          <Badge key={idx} {...styles.purpleBadge}>
                            <BadgeText {...styles.purpleBadgeText}>{getOptionLabel(s, optionsState.specialAttentionOpts)}</BadgeText>
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  )}

                  {item.linkageData.immediateAttention.length > 0 && (
                    <VStack {...styles.subCategoryCol}>
                      <Text {...styles.cardFieldLabel}>Immediate Attention Tags</Text>
                      <HStack {...styles.badgeRow}>
                        {item.linkageData.immediateAttention.map((s, idx) => (
                          <Badge key={idx} {...styles.purpleBadge}>
                            <BadgeText {...styles.purpleBadgeText}>{getOptionLabel(s, optionsState.immediateAttentionOpts)}</BadgeText>
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              )}

              {isAssetCategory(item.categoryName) && item.assetsData && (
                <VStack {...styles.subCategoryCol} {...styles.detailsCol}>
                  <Text {...styles.cardFieldLabel}>Asset Types Offered:</Text>
                  <HStack {...styles.badgeRow}>
                    {item.assetsData.assetTypes.map((s, idx) => (
                      <Badge key={idx} {...styles.greenBadge}>
                        <BadgeText {...styles.greenBadgeText}>{getOptionLabel(s, optionsState.assetTypesOpts)}</BadgeText>
                      </Badge>
                    ))}
                  </HStack>
                </VStack>
              )}
            </VStack>
          </Pressable>
        ))}
      </VStack>

      {/* Edit Form */}
      {isEdit && (
        <VStack {...styles.coverageAddSection}>
          <Text {...styles.addSupportCategoryTitle}>
            {value.some(item => item.categoryName === selectedCategory) ? 'EDIT SUPPORT CATEGORY' : '+ ADD SUPPORT CATEGORY'}
          </Text>
          <VStack {...styles.categorySelectCol}>
            <HStack {...styles.labelCol}>
              <Text {...styles.label}>{t('profile.supportCategoryOffered', 'Support Category Offered')}</Text>
              <Text {...styles.redAsteriskSmall}> *</Text>
            </HStack>
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={(val) => {
                handleSelectCategory(val);
              }}
              placeholder={t('profile.selectCategoryPlaceholder', 'Select Support Category')}
              disabled={value.some(item => item.categoryName === selectedCategory)}
            />
          </VStack>

          {/* select Training / Sessions category */}
          {isTrainingCategory(selectedCategory) && (
            <VStack {...styles.trainingAreaBox}>
              <Text {...styles.trainingAreaTitle}>
                Specific Training Areas
              </Text>
              <VStack {...styles.trainingAreaFieldCol}>
                <Text {...styles.trainingAreaLabel}>
                  {t('profile.socialEmpowerment', 'Social Empowerment Sessions')}
                </Text>
                <Select
                  options={optionsState.socialEmpowermentOpts}
                  value={socialEmpowerment}
                  onChange={setSocialEmpowerment}
                  placeholder={t('profile.selectSocialEmpowerment', 'Select social empowerment sessions...')}
                  multiple={true}
                />
              </VStack>

              <VStack {...styles.trainingAreaFieldCol}>
                <Text {...styles.trainingAreaLabel}>
                  {t('profile.financialInclusion', 'Financial Inclusion Sessions')}
                </Text>
                <Select
                  options={optionsState.financialInclusionOpts}
                  value={financialInclusion}
                  onChange={setFinancialInclusion}
                  placeholder={t('profile.selectFinancialInclusion', 'Select financial inclusion sessions...')}
                  multiple={true}
                />
              </VStack>

              <VStack {...styles.trainingAreaFieldCol}>
                <Text {...styles.trainingAreaLabel}>
                  {t('profile.livelihoods', 'Livelihoods Sessions')}
                </Text>
                <Select
                  options={optionsState.livelihoodsOpts}
                  value={livelihoods}
                  onChange={setLivelihoods}
                  placeholder={t('profile.selectLivelihoods', 'Select livelihoods sessions...')}
                  multiple={true}
                />
              </VStack>
            </VStack>
          )}

          {/* select Linkage to Additional Services category */}
          {isLinkageCategory(selectedCategory) && (
            <VStack {...styles.linkageAreaBox}>
              <VStack {...styles.linkageAreaFieldCol}>
                <Text {...styles.linkageAreaLabel}>
                  {t('profile.specialAttention', 'Special Attention Tags')}
                </Text>
                <Select
                  options={optionsState.specialAttentionOpts}
                  value={specialAttention}
                  onChange={setSpecialAttention}
                  placeholder={t('profile.selectSpecialAttention', 'Select special attention tags...')}
                  multiple={true}
                />
              </VStack>

              <VStack {...styles.linkageAreaFieldCol}>
                <Text {...styles.linkageAreaLabel}>
                  {t('profile.immediateAttention', 'Immediate Attention Tags')}
                </Text>
                <Select
                  options={optionsState.immediateAttentionOpts}
                  value={immediateAttention}
                  onChange={setImmediateAttention}
                  placeholder={t('profile.selectImmediateAttention', 'Select immediate attention tags...')}
                  multiple={true}
                />
              </VStack>
            </VStack>
          )}

          {/* select Assets category */}
          {isAssetCategory(selectedCategory) && (
            <VStack {...styles.assetsAreaBox}>
              <Text {...styles.assetsAreaLabel}>
                {t('profile.assetTypes', 'Asset Types Offered')}
              </Text>
              <Select
                options={optionsState.assetTypesOpts}
                value={assetTypes}
                onChange={setAssetTypes}
                placeholder={t('profile.selectAssetTypes', 'Select asset types...')}
                multiple={true}
              />
            </VStack>
          )}

          <HStack {...styles.actionButtonRow}>
            <Button
              onPress={handleAddCategory}
              isDisabled={isAddDisabled()}
              {...(isAddDisabled() ? styles.addCategoryButtonDisabled : styles.addCategoryButtonActive)}
            >
              <ButtonIcon
                as={LucideIcon}
                name="Plus"
                {...(isAddDisabled() ? styles.addCategoryButtonIconDisabled : styles.addCategoryButtonIconActive)}
              />
              <ButtonText
                {...(isAddDisabled() ? styles.addCategoryButtonTextDisabled : styles.addCategoryButtonTextActive)}
              >
                {value.some(item => item.categoryName === selectedCategory) ? t('profile.updateCategory', 'Update Category') : t('profile.addCategory', 'Add Category')}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      )}
    </VStack>
  );
};

export default SupportCategories;
