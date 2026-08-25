import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { VStack, HStack, Text, Button, ButtonText, ButtonIcon, Badge, BadgeText, Pressable } from '@ui';
import { LucideIcon } from '@ui/index';
import Select from '@components/ui/Inputs/Select';
import { getProvincesList, getSitesByProvince } from '../../../../services/usersService';
import styles from '../styles';

function groupByParentExternalId(
  parents: any[],
  items: any[],
): Record<string, any[]> {
  return parents.reduce<Record<string, any[]>>(
    (result, parent) => {
      result[parent.externalId] = items.filter((item) =>
        item.externalId.startsWith(`${parent.externalId}-`)
      );
      result[parent._id] = items.filter((item) =>
        item.externalId.startsWith(`${parent.externalId}-`)
      );
      return result;
    },
    {},
  );
}

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
  const [allSites, setAllSites] = useState<Record<string, any[]>>({});
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [editingProvinceId, setEditingProvinceId] = useState<string | null>(null);

  // Fetch provinces list on mount
  useEffect(() => {
    const init = async () => {
      setLoadingProvinces(true);
      try {
        const [resPro, resSite] = await Promise.all([getProvincesList(),getSitesByProvince()]);
        setProvinces(resPro || []);
        const data = groupByParentExternalId(resPro,resSite?.result?.data);
        setAllSites(data || {})
      } catch(err) {
        console.error('Error fetching provinces in coverage:', err)
      } finally {
        setLoadingProvinces(false)
      };
    }
    init();
  }, []);

  // Fetch sites when province selection changes
  useEffect(() => {
    const init = async () => {
      if (!selectedProvinceId) {
        setSites([]);
        setSelectedSiteIds([]);
        return;
      }
      setLoadingSites(true);
      try{

        // Check if this province is already in value to pre-populate selected sites
        const selectedProvince = provinces.find(
          p => String(p._id || p.id) === String(selectedProvinceId)
        );
        const resolvedProvinceId = selectedProvince?._id || selectedProvince?.id || selectedProvinceId;
        const provinceName = selectedProvince?.name || selectedProvince?.metaInformation?.name || '';

        const sitesList = allSites?.[selectedProvince?.externalId] || [];
        setSites(sitesList);

        const existing = value.find(
          item =>
            String(item.provinceId) === String(resolvedProvinceId) ||
            (provinceName && item.provinceName?.toLowerCase() === provinceName.toLowerCase())
        );

        if (existing) {
          const matchedSiteIds = sitesList
            .filter((s: any) => {
              const resolvedSiteId = s._id || s.id;
              const sName = s.name || s.metaInformation?.name;
              return (
                existing.siteIds?.includes(resolvedSiteId) ||
                (sName && existing.siteNames?.includes(sName))
              );
            })
            .map((s: any) => s._id || s.id);
          setSelectedSiteIds(matchedSiteIds);
        } else {
          setSelectedSiteIds([]);
        }
      } catch(err) {
        console.error('Error fetching sites in coverage:', err)
      } finally {
        setLoadingSites(false);
      }
    }
    init();
  }, [selectedProvinceId, provinces, value, allSites]);

  // Options mapping
  const provinceOptions = useMemo(() => {
    return provinces
      .filter((p: any) => {
        const pId = p._id || p.id || '';
        const pName = p.name || p.metaInformation?.name || '';

        if (selectedProvinceId && String(pId) === String(selectedProvinceId)) {
          return true;
        }

        const exists = value.some((item) => {
          return (
            (pId && String(item.provinceId) === String(pId)) ||
            (pName && item.provinceName && item.provinceName.toLowerCase() === pName.toLowerCase())
          );
        });

        return !exists;
      })
      .map((p: any) => ({
        value: p._id || p.id || '',
        label: p.name || p.metaInformation?.name || '',
      }));
  }, [provinces, value, selectedProvinceId]);

  const handleSiteChange = (selectedValues: string[]) => {
    if (selectedValues.includes('Select All')) {
      const regularOptions = sites.map((s: any) => s._id || s.id || '');
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

  const handleEditCard = (item: CoverageItem) => {
    setEditingProvinceId(item.provinceId);
    const matchProv = provinces.find(
      (p: any) =>
        String(p._id || p.id) === String(item.provinceId) ||
        (p.name && item.provinceName && p.name.toLowerCase() === item.provinceName.toLowerCase())
    );
    if (matchProv) {
      setSelectedProvinceId(matchProv._id || matchProv.id);
    }
  };

  const handleAddCoverage = () => {
    if (!selectedProvinceId || selectedSiteIds.length === 0) return;

    const selectedProvince: any = provinces.find(
      (p: any) => String(p._id || p.id) === String(selectedProvinceId)
    );
    const resolvedProvinceId = selectedProvince?._id || selectedProvince?.id || selectedProvinceId;
    const provinceName = selectedProvince?.name || selectedProvince?.metaInformation?.name || '';

    const selectedSitesObjects = sites.filter((s: any) =>
      selectedSiteIds.includes(s._id || s.id)
    );
    const newSiteNames = selectedSitesObjects.map((s: any) => s.name || s.metaInformation?.name || '');
    const newSiteIds = selectedSitesObjects.map((s: any) => s._id || s.id);

    const existingIndex = value.findIndex(item =>
      String(item.provinceId) === String(editingProvinceId || resolvedProvinceId) ||
      (provinceName && item.provinceName?.toLowerCase() === provinceName.toLowerCase())
    );

    let nextValue = [...value];
    if (existingIndex > -1) {
      nextValue[existingIndex] = {
        provinceId: resolvedProvinceId,
        provinceName: provinceName || nextValue[existingIndex].provinceName,
        siteIds: newSiteIds,
        siteNames: newSiteNames,
      };
    } else {
      nextValue.push({
        provinceId: resolvedProvinceId,
        provinceName,
        siteIds: newSiteIds,
        siteNames: newSiteNames,
      });
    }

    onChange(nextValue);
    setSelectedProvinceId('');
    setEditingProvinceId(null);
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
      setEditingProvinceId(null);
      setSites([]);
      setSelectedSiteIds([]);
    }
  };

  const getSitesLabel = useCallback(() => {
    
  },[])

  const isEdit = useMemo(() => {
    return mode === 'edit';
  }, [mode]);

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
                handleEditCard(item);
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
                  <HStack style={{ gap: 12, alignItems: 'center' }}>
                    <Pressable onPress={() => handleEditCard(item)}>
                      <LucideIcon name="Pencil" {...styles.trashIcon} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteCard(item.provinceId)}>
                      <LucideIcon name="Trash2" {...styles.trashIcon} />
                    </Pressable>
                  </HStack>
                )}
              </HStack>

              {/* Site Names List */}
              <SelectedSites siteIds={item.siteIds} parent={item.provinceId} allSites={allSites} />
              {/* <HStack {...styles.siteBadgeContainer}>
                {(item.siteNames && item.siteNames.length > 0 ? item.siteNames : item.siteIds).map((siteName, idx) => (
                  <Badge key={idx} {...styles.greyBadge}>
                    <BadgeText {...styles.greyBadgeText}>{siteName}</BadgeText>
                  </Badge>
                ))}
              </HStack> */}
            </VStack>
          </Pressable>
        ))}
      </VStack>

      {/* Edit controls */}
      {isEdit && (
        <VStack {...styles.coverageAddSection}>
          <Text {...styles.coverageAddTitle}>
            {editingProvinceId
              ? t('profile.editProvinceCoverage', 'EDIT PROVINCE COVERAGE')
              : t('profile.addProvinceCoverage', '+ ADD PROVINCE COVERAGE')}
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
                disabled={loadingProvinces || !!editingProvinceId}
              />
            </VStack>

            <VStack {...styles.inputCol}>
              <HStack {...styles.labelCol}>
                <Text {...styles.label}>{t('profile.siteFieldLabel', 'Site Field')}</Text>
                <Text {...styles.redAsteriskSmall}> *</Text>
              </HStack>
              <Select
                options={sites}
                optionConfig={{value:"_id", label:"name"}}
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
              <ButtonText>{editingProvinceId ? t('profile.updateProvince', 'Update Province') : t('profile.addProvince', 'Add Province')}</ButtonText>
            </Button>
          </HStack>
        </VStack>
      )}
    </VStack>
  );
};

export default ProvinceCoverage;

const SelectedSites = ({
  siteIds,
  parent,
  allSites,
}: {
  siteIds: string[];
  parent: string;
  allSites: Record<
    string,
    {
      _id: string;
      externalId: string;
      name: string;
    }[]
  >;
}) => {
  const selectedSites = useMemo(() => {
    const sites = allSites[parent] ?? [];

    return sites.filter((site) => siteIds.includes(site._id));
  }, [allSites, parent, siteIds]);

  return (
    <HStack {...styles.siteBadgeContainer}>
      {selectedSites.map((site) => (
        <Badge key={site._id} {...styles.greyBadge}>
          <BadgeText {...styles.greyBadgeText}>
            {site.name}
          </BadgeText>
        </Badge>
      ))}
    </HStack>
  );
};