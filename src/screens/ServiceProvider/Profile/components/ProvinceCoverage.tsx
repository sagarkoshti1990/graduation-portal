import React, { useEffect, useState, useMemo } from 'react';
import { VStack, HStack, Text, Button, ButtonText, ButtonIcon, Badge, BadgeText, Pressable } from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import { getProvincesList, getSitesByProvince } from '../../../../services/usersService';
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
        const sitesList = res.result?.data || [];
        setSites(sitesList);

        // Check if this province is already in value to pre-populate selected sites
        const selectedProvince = provinces.find(
          p => (p._id || p.id) === selectedProvinceId || p.externalId === selectedProvinceId
        );
        const provinceExtId = selectedProvince?.externalId || selectedProvince?.metaInformation?.externalId || selectedProvince?._id || selectedProvinceId;
        const provinceName = selectedProvince?.name || selectedProvince?.metaInformation?.name || '';

        const existing = value.find(
          item =>
            item.provinceId === provinceExtId ||
            item.provinceId === selectedProvince?._id ||
            (provinceName && item.provinceName?.toLowerCase() === provinceName.toLowerCase())
        );

        if (existing) {
          const matchedSiteIds = sitesList
            .filter((s: any) => {
              const sExtId = s.externalId || s.metaInformation?.externalId || s._id || s.id;
              const sMongoId = s._id || s.id;
              const sName = s.name || s.metaInformation?.name;
              return (
                existing.siteIds?.includes(sExtId) ||
                existing.siteIds?.includes(sMongoId) ||
                (sName && existing.siteNames?.includes(sName))
              );
            })
            .map((s: any) => s.externalId || s.metaInformation?.externalId || s._id || s.id);
          setSelectedSiteIds(matchedSiteIds);
        } else {
          setSelectedSiteIds([]);
        }
      })
      .catch(err => console.error('Error fetching sites in coverage:', err))
      .finally(() => setLoadingSites(false));
  }, [selectedProvinceId, provinces, value]);

  // Options mapping
  const provinceOptions = useMemo(() => {
    return provinces
      .filter((p: any) => {
        const pId = p._id || p.id || p.externalId || '';
        const pExtId = p.externalId || p.metaInformation?.externalId || p._id || '';
        const pName = p.name || p.metaInformation?.name || '';

        // If it's the currently selected province, keep it in the options
        if (
          selectedProvinceId &&
          (pId === selectedProvinceId ||
            pExtId === selectedProvinceId ||
            p._id === selectedProvinceId ||
            p.id === selectedProvinceId)
        ) {
          return true;
        }

        // Check if already exists in added coverages (value)
        const exists = value.some((item) => {
          return (
            (pId && item.provinceId === pId) ||
            (pExtId && item.provinceId === pExtId) ||
            (p._id && item.provinceId === p._id) ||
            (p.id && item.provinceId === p.id) ||
            (pName && item.provinceName && item.provinceName.toLowerCase() === pName.toLowerCase())
          );
        });

        return !exists;
      })
      .map((p: any) => ({
        value: p._id || p.id || p.externalId || '',
        label: p.name || p.metaInformation?.name || '',
      }));
  }, [provinces, value, selectedProvinceId]);

  const siteOptions = useMemo(() => {
    return sites.map((s: any) => ({
      value: s.externalId || s.metaInformation?.externalId || s._id || s.id || '',
      label: s.name || s.metaInformation?.name || '',
    }));
  }, [sites]);

  const handleSiteChange = (selectedValues: string[]) => {
    if (selectedValues.includes('Select All')) {
      const regularOptions = sites.map((s: any) => s.externalId || s.metaInformation?.externalId || s._id || s.id || '');
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

    const selectedProvince: any = provinces.find(
      (p: any) => (p._id || p.id) === selectedProvinceId || p.externalId === selectedProvinceId
    );
    const provinceExtId = selectedProvince?.externalId || selectedProvince?.metaInformation?.externalId || selectedProvince?._id || selectedProvinceId;
    const provinceName = selectedProvince?.name || selectedProvince?.metaInformation?.name || '';

    const selectedSitesObjects = sites.filter((s: any) =>
      selectedSiteIds.includes(s.externalId || s.metaInformation?.externalId || s._id || s.id)
    );
    const newSiteNames = selectedSitesObjects.map((s: any) => s.name || s.metaInformation?.name || '');
    const newSiteIds = selectedSitesObjects.map((s: any) => s.externalId || s.metaInformation?.externalId || s._id || s.id);

    // Check if this province is already added
    const existingIndex = value.findIndex(item =>
      item.provinceId === provinceExtId ||
      item.provinceId === selectedProvince?._id ||
      (provinceName && item.provinceName?.toLowerCase() === provinceName.toLowerCase())
    );

    let nextValue = [...value];
    if (existingIndex > -1) {
      // Replace existing coverage card with updated values
      nextValue[existingIndex] = {
        provinceId: provinceExtId,
        provinceName: provinceName || nextValue[existingIndex].provinceName,
        siteIds: newSiteIds,
        siteNames: newSiteNames,
      };
    } else {
      nextValue.push({
        provinceId: provinceExtId,
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
    const selectedProv = provinces.find(p => (p._id || p.id) === selectedProvinceId);
    const selectedExtId = selectedProv?.externalId || selectedProv?.metaInformation?.externalId || selectedProv?._id;
    if (provinceId === selectedProvinceId || provinceId === selectedExtId) {
      setSelectedProvinceId('');
      setSites([]);
      setSelectedSiteIds([]);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <VStack {...styles.coverageContainer}>
      {/* Title */}
      <VStack {...styles.titleContainer}>
        <Text {...styles.subSectionTitle}>
          {t('profile.provinceCoverage', 'Province Coverage')}
        </Text>
      </VStack>

      {/* Added Cards */}
      <VStack {...styles.addedCardsContainer}>
        {value.length === 0 && !isEdit && (
          <Text {...styles.noCoverageText}>
            {t('profile.noCoverage', 'No province coverage added.')}
          </Text>
        )}
        {value.map(item => (
          <Pressable
            key={item.provinceId}
            onPress={() => {
              if (isEdit) {
                const matchProv = provinces.find(
                  p =>
                    (p.externalId && p.externalId === item.provinceId) ||
                    (p._id && p._id === item.provinceId) ||
                    (p.metaInformation?.externalId && p.metaInformation.externalId === item.provinceId) ||
                    (p.name && item.provinceName && p.name.toLowerCase() === item.provinceName.toLowerCase())
                );
                if (matchProv) {
                  setSelectedProvinceId(matchProv._id || matchProv.id || matchProv.externalId);
                }
              }
            }}
          >
            <VStack {...styles.coverageCard}>
              <HStack {...styles.cardHeader}>
                <HStack {...styles.cardHeaderLeft}>
                  <LucideIcon name="MapPin" {...styles.mapPinIcon} />
                  <Text {...styles.cardTitleText}>
                    {item.provinceName || provinces.find(p => (p.externalId === item.provinceId || p._id === item.provinceId || p.id === item.provinceId))?.name || item.provinceId}
                  </Text>
                  <Badge {...styles.cardBadge}>
                    <BadgeText {...styles.blueBadgeText}>
                      {`${item.siteIds.length} ${item.siteIds.length === 1 ? 'site' : 'sites'}`}
                    </BadgeText>
                  </Badge>
                </HStack>
                {isEdit && (
                  <Pressable onPress={() => handleDeleteCard(item.provinceId)}>
                    <LucideIcon name="Trash2" {...styles.trashIcon} />
                  </Pressable>
                )}
              </HStack>

              {/* Site Names List */}
              <HStack {...styles.siteBadgeContainer}>
                {(item.siteNames && item.siteNames.length > 0 ? item.siteNames : item.siteIds).map((siteName, idx) => (
                  <Badge key={idx} {...styles.greyBadge}>
                    <BadgeText {...styles.greyBadgeText}>{siteName}</BadgeText>
                  </Badge>
                ))}
              </HStack>
            </VStack>
          </Pressable>
        ))}
      </VStack>

      {/* Edit controls */}
      {isEdit && (
        <VStack {...styles.coverageAddSection}>
          <Text {...styles.coverageAddTitle}>
            + ADD PROVINCE COVERAGE
          </Text>
          <HStack {...styles.coverageAddInputs}>
            <VStack {...styles.inputCol}>
              <HStack {...styles.labelCol}>
                <Text {...styles.label}>{t('profile.provinceLabel', 'Province')}</Text>
                <Text {...styles.redAsteriskSmall}> *</Text>
              </HStack>
              <Select
                options={provinceOptions}
                value={selectedProvinceId}
                onChange={(val) => setSelectedProvinceId(val)}
                placeholder={t('profile.selectProvincePlaceholder', 'Select province')}
                disabled={loadingProvinces}
              />
            </VStack>

            <VStack {...styles.inputCol}>
              <HStack {...styles.labelCol}>
                <Text {...styles.label}>{t('profile.siteFieldLabel', 'Site Field')}</Text>
                <Text {...styles.redAsteriskSmall}> *</Text>
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

          <HStack {...styles.actionButtonRow}>
            <Button
              onPress={handleAddCoverage}
              isDisabled={!selectedProvinceId || selectedSiteIds.length === 0}
              {...(selectedProvinceId ? styles.addButtonActive : styles.addButtonDisabled)}
            >
              <ButtonIcon as={LucideIcon} name="Plus" {...styles.plusIconSmall} />
              <ButtonText>{t('profile.addProvince', 'Add Province')}</ButtonText>
            </Button>
          </HStack>
        </VStack>
      )}
    </VStack>
  );
};

export default ProvinceCoverage;
