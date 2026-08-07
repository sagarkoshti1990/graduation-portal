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

  const handleAddCategory = () => {
    if (!selectedCategory) return;

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

    onChange([...value, newItem]);
    setSelectedCategory('');
    resetFormState();
  };

  const handleDeleteCategory = (id: string) => {
    onChange(value.filter(item => item.id !== id));
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
    <VStack space="md" width="100%">
      {/* Added Category Cards */}
      <VStack space="sm">
        {value.length === 0 && !isEdit && (
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
            {t('profile.noSupportCategories', 'No support categories added.')}
          </Text>
        )}
        {value.map(item => (
          <VStack key={item.id} {...styles.categoryCard}>
            <HStack justifyContent="space-between" alignItems="center" width="100%">
              <HStack alignItems="center">
                <Text {...TYPOGRAPHY.bodySmall} fontWeight="700" color="$primary700">
                  {item.categoryName}
                </Text>
                <Badge {...styles.redBadge} ml="$2" mr={0} mb={0}>
                  <BadgeText {...styles.redBadgeText}>Offered</BadgeText>
                </Badge>
              </HStack>
              {isEdit && (
              <Pressable onPress={() => handleDeleteCategory(item.id)}>
                <LucideIcon name="Trash2" size={16} color="$error600" />
              </Pressable>
              )}
            </HStack>

            {/* Render Category Details */}
            {item.categoryName === 'Training / Sessions' && item.trainingData && (
              <VStack space="sm" mt="$2">
                <Text {...styles.cardSectionHeading}>Specific Training Areas:</Text>
                
                {item.trainingData.socialEmpowerment.length > 0 && (
                  <VStack space="xs">
                    <Text {...styles.cardFieldLabel}>Social Empowerment Sessions</Text>
                    <HStack space="xs" flexWrap="wrap">
                      {item.trainingData.socialEmpowerment.map((s, idx) => (
                        <Badge key={idx} {...styles.blueBadge}>
                          <BadgeText {...styles.blueBadgeText}>{s}</BadgeText>
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                )}

                {item.trainingData.financialInclusion.length > 0 && (
                  <VStack space="xs">
                    <Text {...styles.cardFieldLabel}>Financial Inclusion Sessions</Text>
                    <HStack space="xs" flexWrap="wrap">
                      {item.trainingData.financialInclusion.map((s, idx) => (
                        <Badge key={idx} {...styles.blueBadge}>
                          <BadgeText {...styles.blueBadgeText}>{s}</BadgeText>
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                )}

                {item.trainingData.livelihoods.length > 0 && (
                  <VStack space="xs">
                    <Text {...styles.cardFieldLabel}>Livelihoods Sessions</Text>
                    <HStack space="xs" flexWrap="wrap">
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
              <VStack space="sm" mt="$2">
                {item.linkageData.specialAttention.length > 0 && (
                  <VStack space="xs">
                    <Text {...styles.cardFieldLabel}>Special Attention Tags</Text>
                    <HStack space="xs" flexWrap="wrap">
                      {item.linkageData.specialAttention.map((s, idx) => (
                        <Badge key={idx} {...styles.purpleBadge}>
                          <BadgeText {...styles.purpleBadgeText}>{s}</BadgeText>
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                )}

                {item.linkageData.immediateAttention.length > 0 && (
                  <VStack space="xs">
                    <Text {...styles.cardFieldLabel}>Immediate Attention Tags</Text>
                    <HStack space="xs" flexWrap="wrap">
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
              <VStack space="xs" mt="$2">
                <Text {...styles.cardFieldLabel}>Asset Types Offered:</Text>
                <HStack space="xs" flexWrap="wrap">
                  {item.assetsData.assetTypes.map((s, idx) => (
                    <Badge key={idx} {...styles.greenBadge}>
                      <BadgeText {...styles.greenBadgeText}>{s}</BadgeText>
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            )}

            {item.categoryName === 'Others' && item.othersData && (
              <VStack space="xs" mt="$2">
                <Text {...styles.cardFieldLabel}>Details</Text>
                <Text {...TYPOGRAPHY.bodySmall} color="$textForeground">{item.othersData}</Text>
              </VStack>
            )}
          </VStack>
        ))}
      </VStack>

      {/* Edit Form */}
      {isEdit && (
      <VStack space="md" {...styles.coverageAddSection}>
        <Text fontSize={12} fontWeight="700" color="$primary500" letterSpacing={0.5}>
          + ADD SUPPORT CATEGORY
        </Text>
        <VStack space="xs">
          <HStack>
            <Text {...styles.label}>{t('profile.supportCategoryOffered', 'Support Category Offered')}</Text>
            <Text color="$red500" fontSize={12}> *</Text>
          </HStack>
          <Select
            options={CATEGORY_OPTIONS}
            value={selectedCategory}
            onChange={(val) => {
              setSelectedCategory(val);
              resetFormState();
            }}
            placeholder={t('profile.selectCategoryPlaceholder', 'Select Support Category')}
          />
        </VStack>

        {/* select Training / Sessions category */}
        {selectedCategory === 'Training / Sessions' && (
          <VStack
            space="md"
            p="$4"
            bg="#eff6ff"
            borderWidth={1}
            borderColor="#bfdbfe"
            borderRadius="$lg"
          >
            <Text fontSize={14} fontWeight="700" color="#1d4ed8" mb="$1">
              Specific Training Areas
            </Text>
            <VStack space="xs">
              <Text {...styles.label} fontWeight="600" mb={0}>
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

            <VStack space="xs">
              <Text {...styles.label} fontWeight="600" mb={0}>
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

            <VStack space="xs">
              <Text {...styles.label} fontWeight="600" mb={0}>
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
          <VStack
            space="md"
            p="$4"
            bg="#faf5ff"
            borderWidth={1}
            borderColor="#e9d5ff"
            borderRadius="$lg"
          >
            <VStack space="xs">
              <Text {...styles.label} fontWeight="600" mb={0}>
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

            <VStack space="xs">
              <Text {...styles.label} fontWeight="600" mb={0}>
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
          <VStack
            space="md"
            p="$4"
            bg="#f0fdf4"
            borderWidth={1}
            borderColor="#bbf7d0"
            borderRadius="$lg"
          >
              <Text {...styles.label} color="$success800" fontWeight="700">
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
          <VStack space="xs">
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

        <HStack justifyContent="flex-end" width="100%">
          <Button
            variant="solid"
            onPress={handleAddCategory}
            isDisabled={isAddDisabled()}
            bg={isAddDisabled() ? '$background100' : '$primary500'}
            borderColor={isAddDisabled() ? '$background100' : '$primary500'}
            size="sm"
            style={{
              borderRadius: 8,
              height: 38,
            }}
          >
            <ButtonIcon as={LucideIcon} name="Plus" mr="$2" color={isAddDisabled() ? '$textMuted' : '$white'} />
            <ButtonText color={isAddDisabled() ? '$textMuted' : '$white'} fontWeight="600">
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
