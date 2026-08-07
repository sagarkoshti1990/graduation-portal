import React, { useEffect, useState, useMemo } from 'react';
import { VStack, HStack, Text, Box, Button, ButtonText, ButtonIcon, Badge, BadgeText, Pressable } from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import { getProvincesList, getSitesByProvince } from '../../../../services/usersService';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import styles from '../styles';

export interface CoverageItem {
  provinceId: string;
  provinceName: string;
  siteIds: string[];
  siteNames: string[];
}

interface ProvinceCoverageProps {
  value: CoverageItem[];
  onChange: (value: CoverageItem[]) => void;
  mode: 'preview' | 'edit';
  t: any;
}

export const ProvinceCoverage: React.FC<ProvinceCoverageProps> = ({
  value = [],
  onChange,
  mode,
  t,
}) => {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);

  // Fetch provinces list on mount
  useEffect(() => {
    setLoadingProvinces(true);
    getProvincesList()
      .then(res => {
        setProvinces(res || []);
      })
      .catch(err => console.error('Error fetching provinces in coverage:', err))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Fetch sites when province selection changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setSites([]);
      setSelectedSiteIds([]);
      return;
    }
    setLoadingSites(true);
    getSitesByProvince({ provinceId: selectedProvinceId, page: 1, limit: 100 })
      .then(res => {
        setSites(res.result?.data || []);
        setSelectedSiteIds([]);
      })
      .catch(err => console.error('Error fetching sites in coverage:', err))
      .finally(() => setLoadingSites(false));
  }, [selectedProvinceId]);

  // Options mapping
  const provinceOptions = useMemo(() => {
    return provinces.map(p => ({
      value: p._id || p.id || '',
      label: p.name || p.metaInformation?.name || '',
    }));
  }, [provinces]);

  const siteOptions = useMemo(() => {
    return sites.map(s => ({
      value: s._id || s.id || '',
      label: s.name || s.metaInformation?.name || '',
    }));
  }, [sites]);

  const handleSiteChange = (selectedValues: string[]) => {
    if (selectedValues.includes('Select All')) {
      const regularOptions = sites.map(s => s._id || s.id || '');
      const allAlreadySelected = regularOptions.every(val => selectedValues.includes(val));
      if (allAlreadySelected) {
        setSelectedSiteIds([]);
      } else {
        setSelectedSiteIds(regularOptions);
      }
    } else {
      setSelectedSiteIds(selectedValues);
    }
  };

  const handleAddCoverage = () => {
    if (!selectedProvinceId || selectedSiteIds.length === 0) return;

    // Check if this province is already added
    const existingIndex = value.findIndex(item => item.provinceId === selectedProvinceId);
    
    const selectedProvince = provinces.find(p => (p._id || p.id) === selectedProvinceId);
    const provinceName = selectedProvince?.name || selectedProvince?.metaInformation?.name || '';
    
    const selectedSitesObjects = sites.filter(s => selectedSiteIds.includes(s._id || s.id));
    const newSiteNames = selectedSitesObjects.map(s => s.name || s.metaInformation?.name || '');
    const newSiteIds = selectedSitesObjects.map(s => s._id || s.id);

    let nextValue = [...value];
    if (existingIndex > -1) {
      // Merge sites
      const existing = nextValue[existingIndex];
      const mergedSiteIds = Array.from(new Set([...existing.siteIds, ...newSiteIds]));
      const mergedSiteNames = Array.from(new Set([...existing.siteNames, ...newSiteNames]));
      nextValue[existingIndex] = {
        ...existing,
        siteIds: mergedSiteIds,
        siteNames: mergedSiteNames,
      };
    } else {
      nextValue.push({
        provinceId: selectedProvinceId,
        provinceName,
        siteIds: newSiteIds,
        siteNames: newSiteNames,
      });
    }

    onChange(nextValue);
    setSelectedProvinceId('');
    setSites([]);
    setSelectedSiteIds([]);
  };

  const handleDeleteCard = (provinceId: string) => {
    const nextValue = value.filter(item => item.provinceId !== provinceId);
    onChange(nextValue);
  };

  const isEdit = mode === 'edit';

  return (
    <VStack space="md" width="100%">
      {/* Title */}
      <VStack space="xs">
        <Text {...styles.subSectionTitle}>
          {t('profile.provinceCoverage', 'Province Coverage')}
        </Text>
      </VStack>

      {/* Added Cards */}
      <VStack space="sm">
        {value.length === 0 && !isEdit && (
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
            {t('profile.noCoverage', 'No province coverage added.')}
          </Text>
        )}
        {value.map(item => (
          <VStack key={item.provinceId} {...styles.coverageCard}>
            <HStack justifyContent="space-between" alignItems="center" width="100%">
              <HStack space="sm" alignItems="center" flex={1}>
                <LucideIcon name="MapPin" size={16} color="$primary500" />
                <Text {...TYPOGRAPHY.bodySmall} fontWeight="700" color="$textForeground">
                  {item.provinceName}
                </Text>
                <Badge {...styles.blueBadge} mr={0} mb={0}>
                  <BadgeText {...styles.blueBadgeText}>
                    {`${item.siteIds.length} ${item.siteIds.length === 1 ? 'site' : 'sites'}`}
                  </BadgeText>
                </Badge>
              </HStack>
              {isEdit && (
              <Pressable onPress={() => handleDeleteCard(item.provinceId)}>
                <LucideIcon name="Trash2" size={16} color="$error600" />
              </Pressable>
              )}
            </HStack>
            
            {/* Site Names List */}
            <HStack space="xs" flexWrap="wrap" mt="$2">
              {item.siteNames.map((siteName, idx) => (
                <Badge key={idx} {...styles.greyBadge}>
                  <BadgeText {...styles.greyBadgeText}>{siteName}</BadgeText>
                </Badge>
              ))}
            </HStack>
          </VStack>
        ))}
      </VStack>

      {/* Edit controls */}
      {isEdit && (
      <VStack space="md" {...styles.coverageAddSection}>
        <Text fontSize={12} fontWeight="700" color="$primary500" letterSpacing={0.5}>
          + ADD PROVINCE COVERAGE
        </Text>
        <HStack space="md" width="100%">
          <VStack flex={1} space="xs">
            <HStack>
              <Text {...styles.label}>{t('profile.provinceLabel', 'Province')}</Text>
              <Text color="$red500" fontSize={12}> *</Text>
            </HStack>
            <Select
              options={provinceOptions}
              value={selectedProvinceId}
              onChange={(val) => setSelectedProvinceId(val)}
              placeholder={t('profile.selectProvincePlaceholder', 'Select province')}
              disabled={loadingProvinces}
            />
          </VStack>

          <VStack flex={1} space="xs">
            <HStack>
              <Text {...styles.label}>{t('profile.siteFieldLabel', 'Site Field')}</Text>
              <Text color="$red500" fontSize={12}> *</Text>
            </HStack>
            <Select
              options={siteOptions}
              value={selectedSiteIds}
              onChange={handleSiteChange}
              placeholder={t('profile.selectSitesPlaceholder', selectedProvinceId ? 'Select site' : 'Select province first')}
              multiple={true}
              disabled={loadingSites || !selectedProvinceId}
            />
          </VStack>
        </HStack>

        <HStack justifyContent="flex-end" width="100%">
          <Button
            variant="solid"
            action="primary"
            onPress={handleAddCoverage}
              isDisabled={!selectedProvinceId || selectedSiteIds.length === 0}  
            bg={selectedProvinceId ? '#7a1f2d' : '#cca3a9'}
            style={{ borderRadius: 6, height: 40 }}            >
              <ButtonIcon as={LucideIcon} name="Plus" mr="$1" />
              <ButtonText>{t('profile.addProvince', 'Add Province')}</ButtonText>
          </Button>
        </HStack>
      </VStack>
      )}
    </VStack>
  );
};

export default ProvinceCoverage;
