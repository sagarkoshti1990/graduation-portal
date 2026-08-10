import React, { useState } from 'react';
import { VStack, HStack, Text, Box, Button, ButtonText, ButtonIcon, Badge, BadgeText, Pressable, Input, InputField } from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import styles from '../styles';

export interface SupportCategoryItem {
  id: string;
  categoryName: string;
  trainingData?: {
    socialEmpowerment: string[];
    financialInclusion: string[];
    livelihoods: string[];
  };
  linkageData?: {
    specialAttention: string[];
    immediateAttention: string[];
  };
  assetsData?: {
    assetTypes: string[];
  };
  othersData?: string;
}

interface SupportCategoriesProps {
  value: SupportCategoryItem[];
  onChange: (value: SupportCategoryItem[]) => void;
  mode: 'preview' | 'edit';
  t: any;
}

const CATEGORY_OPTIONS = [
  { value: 'Training / Sessions', label: 'Training / Sessions' },
  { value: 'Linkage to Additional Services', label: 'Linkage to Additional Services' },
  { value: 'Assets', label: 'Assets' },
  { value: 'Others', label: 'Others' },
];

const SOCIAL_EMPOWERMENT_OPTS = [
  { value: 'Select All (4)', label: 'Select All (4)' },
  { value: 'Personal Mastery Training', label: 'Personal Mastery Training' },
  { value: 'Parenting Skills Training', label: 'Parenting Skills Training' },
  { value: 'GBV Awareness Session', label: 'GBV Awareness Session' },
  { value: 'Substance Abuse Awareness Session', label: 'Substance Abuse Awareness Session' },
];

const FINANCIAL_INCLUSION_OPTS = [
  { value: 'Financial Literacy Training', label: 'Financial Literacy Training' },
];

const LIVELIHOODS_OPTS = [
  { value: 'Select All (8)', label: 'Select All (8)' },
  { value: 'Generate Your Business Idea Training', label: 'Generate Your Business Idea Training' },
  { value: 'Start Your Business Training', label: 'Start Your Business Training' },
  { value: 'Diversification Strategy', label: 'Diversification Strategy' },
  { value: 'Market Growth Strategy', label: 'Market Growth Strategy' },
  { value: 'Livelihood Specific Training', label: 'Livelihood Specific Training' },
  { value: 'Job Readiness Training', label: 'Job Readiness Training' },
  { value: 'Technical/Vocational Training', label: 'Technical/Vocational Training' },
  { value: 'Work Placement', label: 'Work Placement' },
];

const SPECIAL_ATTENTION_OPTS = [
  { value: 'Select All (3)', label: 'Select All (3)' },
  { value: 'GBV', label: 'GBV' },
  { value: 'Mental Health', label: 'Mental Health' },
  { value: 'Substance Abuse', label: 'Substance Abuse' },
];

const IMMEDIATE_ATTENTION_OPTS = [
  { value: 'Select All (3)', label: 'Select All (3)' },
  { value: 'Food', label: 'Food' },
  { value: 'Health', label: 'Health' },
  { value: 'Municipal Indigent Programs', label: 'Municipal Indigent Programs' },
];

const ASSETS_OPTS = [
  { value: 'Select All (3)', label: 'Select All (3)' },
  { value: 'Cash', label: 'Cash' },
  { value: 'In-kind', label: 'In-kind' },
  { value: 'Voucher', label: 'Voucher' },
];

export const SupportCategories: React.FC<SupportCategoriesProps> = ({
  value = [],
  onChange,
  mode,
  t,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
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
      if (catName === 'Training / Sessions') {
        setSocialEmpowerment(existing.trainingData?.socialEmpowerment || []);
        setFinancialInclusion(existing.trainingData?.financialInclusion || []);
        setLivelihoods(existing.trainingData?.livelihoods || []);
        setSpecialAttention([]);
        setImmediateAttention([]);
        setAssetTypes([]);
        setOthersText('');
      } else if (catName === 'Linkage to Additional Services') {
        setSpecialAttention(existing.linkageData?.specialAttention || []);
        setImmediateAttention(existing.linkageData?.immediateAttention || []);
        setSocialEmpowerment([]);
        setFinancialInclusion([]);
        setLivelihoods([]);
        setAssetTypes([]);
        setOthersText('');
      } else if (catName === 'Assets') {
        setAssetTypes(existing.assetsData?.assetTypes || []);
        setSocialEmpowerment([]);
        setFinancialInclusion([]);
        setLivelihoods([]);
        setSpecialAttention([]);
        setImmediateAttention([]);
        setOthersText('');
      } else if (catName === 'Others') {
        setOthersText(existing.othersData || '');
        setSocialEmpowerment([]);
        setFinancialInclusion([]);
        setLivelihoods([]);
        setSpecialAttention([]);
        setImmediateAttention([]);
        setAssetTypes([]);
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

      if (selectedCategory === 'Training / Sessions') {
        if (socialEmpowerment.length === 0 && financialInclusion.length === 0 && livelihoods.length === 0) return;
        updatedItem.trainingData = {
          socialEmpowerment,
          financialInclusion,
          livelihoods,
        };
      } else if (selectedCategory === 'Linkage to Additional Services') {
        if (specialAttention.length === 0 && immediateAttention.length === 0) return;
        updatedItem.linkageData = {
          specialAttention,
          immediateAttention,
        };
      } else if (selectedCategory === 'Assets') {
        if (assetTypes.length === 0) return;
        updatedItem.assetsData = {
          assetTypes,
        };
      } else if (selectedCategory === 'Others') {
        if (!othersText.trim()) return;
        updatedItem.othersData = othersText.trim();
      }

      nextValue[existingIndex] = updatedItem;
    } else {
      let newItem: SupportCategoryItem = {
        id: `${selectedCategory}-${Date.now()}`,
        categoryName: selectedCategory,
      };

      if (selectedCategory === 'Training / Sessions') {
        if (socialEmpowerment.length === 0 && financialInclusion.length === 0 && livelihoods.length === 0) return;
        newItem.trainingData = {
          socialEmpowerment,
          financialInclusion,
          livelihoods,
        };
      } else if (selectedCategory === 'Linkage to Additional Services') {
        if (specialAttention.length === 0 && immediateAttention.length === 0) return;
        newItem.linkageData = {
          specialAttention,
          immediateAttention,
        };
      } else if (selectedCategory === 'Assets') {
        if (assetTypes.length === 0) return;
        newItem.assetsData = {
          assetTypes,
        };
      } else if (selectedCategory === 'Others') {
        if (!othersText.trim()) return;
        newItem.othersData = othersText.trim();
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
    if (selectedCategory === 'Training / Sessions') {
      return socialEmpowerment.length === 0 && financialInclusion.length === 0 && livelihoods.length === 0;
    }
    if (selectedCategory === 'Linkage to Additional Services') {
      return specialAttention.length === 0 && immediateAttention.length === 0;
    }
    if (selectedCategory === 'Assets') {
      return assetTypes.length === 0;
    }
    if (selectedCategory === 'Others') {
      return !othersText.trim();
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
                    {item.categoryName}
                  </Text>
                  <Badge {...styles.offeredBadge}>
                    <BadgeText {...styles.redBadgeText}>Offered</BadgeText>
                  </Badge>
                </HStack>
                {isEdit && (
                  <Pressable onPress={() => handleDeleteCategory(item.id)}>
                    <LucideIcon name="Trash2" {...styles.trashIcon} />
                  </Pressable>
                )}
              </HStack>

            {/* Render Category Details */}
            {item.categoryName === 'Training / Sessions' && item.trainingData && (
              <VStack {...styles.subCategoriesContainer}>
                <Text {...styles.specificTrainingTitle}>Specific Training Areas:</Text>
                
                {item.trainingData.socialEmpowerment.length > 0 && (
                  <VStack {...styles.subCategoryCol}>
                    <Text {...styles.cardFieldLabel}>Social Empowerment Sessions</Text>
                    <HStack {...styles.badgeRow}>
                      {item.trainingData.socialEmpowerment.map((s, idx) => (
                        <Badge key={idx} {...styles.blueBadge}>
                          <BadgeText {...styles.blueBadgeText}>{s}</BadgeText>
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
                          <BadgeText {...styles.blueBadgeText}>{s}</BadgeText>
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
                          <BadgeText {...styles.blueBadgeText}>{s}</BadgeText>
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                )}
              </VStack>
            )}

            {item.categoryName === 'Linkage to Additional Services' && item.linkageData && (
              <VStack {...styles.subCategoriesContainer}>
                {item.linkageData.specialAttention.length > 0 && (
                  <VStack {...styles.subCategoryCol}>
                    <Text {...styles.cardFieldLabel}>Special Attention Tags</Text>
                    <HStack {...styles.badgeRow}>
                      {item.linkageData.specialAttention.map((s, idx) => (
                        <Badge key={idx} {...styles.purpleBadge}>
                          <BadgeText {...styles.purpleBadgeText}>{s}</BadgeText>
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
                          <BadgeText {...styles.purpleBadgeText}>{s}</BadgeText>
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                )}
              </VStack>
            )}

            {item.categoryName === 'Assets' && item.assetsData && (
              <VStack {...styles.subCategoryCol} {...styles.detailsCol}>
                <Text {...styles.cardFieldLabel}>Asset Types Offered:</Text>
                <HStack {...styles.badgeRow}>
                  {item.assetsData.assetTypes.map((s, idx) => (
                    <Badge key={idx} {...styles.greenBadge}>
                      <BadgeText {...styles.greenBadgeText}>{s}</BadgeText>
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            )}

            {item.categoryName === 'Others' && item.othersData && (
              <VStack {...styles.detailsCol}>
                <Text {...styles.cardFieldLabel}>Details</Text>
                <Text {...styles.detailsText}>{item.othersData}</Text>
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
          + ADD SUPPORT CATEGORY
        </Text>
        <VStack {...styles.categorySelectCol}>
          <HStack {...styles.labelCol}>
            <Text {...styles.label}>{t('profile.supportCategoryOffered', 'Support Category Offered')}</Text>
            <Text {...styles.redAsteriskSmall}> *</Text>
          </HStack>
          <Select
            options={CATEGORY_OPTIONS}
            value={selectedCategory}
            onChange={(val) => {
              handleSelectCategory(val);
            }}
            placeholder={t('profile.selectCategoryPlaceholder', 'Select Support Category')}
          />
        </VStack>

        {/* select Training / Sessions category */}
        {selectedCategory === 'Training / Sessions' && (
          <VStack {...styles.trainingAreaBox}>
            <Text {...styles.trainingAreaTitle}>
              Specific Training Areas
            </Text>
            <VStack {...styles.trainingAreaFieldCol}>
              <Text {...styles.trainingAreaLabel}>
                {t('profile.socialEmpowerment', 'Social Empowerment Sessions')}
              </Text>
              <Select
                options={SOCIAL_EMPOWERMENT_OPTS}
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
                options={FINANCIAL_INCLUSION_OPTS}
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
                options={LIVELIHOODS_OPTS}
                value={livelihoods}
                onChange={setLivelihoods}
                placeholder={t('profile.selectLivelihoods', 'Select livelihoods sessions...')}
                multiple={true}
              />
            </VStack>
          </VStack>
        )}

        {/* select Linkage to Additional Services category */}
        {selectedCategory === 'Linkage to Additional Services' && (
          <VStack {...styles.linkageAreaBox}>
            <VStack {...styles.linkageAreaFieldCol}>
              <Text {...styles.linkageAreaLabel}>
                {t('profile.specialAttention', 'Special Attention Tags')}
              </Text>
              <Select
                options={SPECIAL_ATTENTION_OPTS}
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
                options={IMMEDIATE_ATTENTION_OPTS}
                value={immediateAttention}
                onChange={setImmediateAttention}
                placeholder={t('profile.selectImmediateAttention', 'Select immediate attention tags...')}
                multiple={true}
              />
            </VStack>
          </VStack>
        )}

        {/* select Assets category */}
        {selectedCategory === 'Assets' && (
          <VStack {...styles.assetsAreaBox}>
              <Text {...styles.assetsAreaLabel}>
                {t('profile.assetTypes', 'Asset Types Offered')}
            </Text>
            <Select
              options={ASSETS_OPTS}
              value={assetTypes}
                onChange={setAssetTypes}
              placeholder={t('profile.selectAssetTypes', 'Select asset types...')}
              multiple={true}
            />
          </VStack>
        )}

        {/* select Others category */}
        {selectedCategory === 'Others' && (
          <VStack {...styles.othersAreaCol}>
            <Text {...styles.label}>{t('profile.otherDetails', 'Other Support Details')}</Text>
            <Input {...styles.textInput}>
              <InputField
                placeholder={t('profile.otherDetailsPlaceholder', 'Enter custom support offerings')}
                value={othersText}
                onChangeText={setOthersText}
              />
            </Input>
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
              {t('profile.addCategory', 'Add Category')}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
      )}
    </VStack>
  );
};

export default SupportCategories;
