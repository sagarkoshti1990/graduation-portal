import { useState, useEffect, useMemo } from 'react';
import { getSitesByProvince } from '../services/usersService';
import { getSessionTypesByPillar, MentoringOption } from '../services/mentoringService';
import { buildTrainingFormOptionsMap } from '@utils/supportProvider';

interface UseTrainingFormOptionsParams {
  values: Record<string, any>;
  provinces?: any[];
  pillers?: MentoringOption[];
  targetAudience?: MentoringOption[];
  deliveryModes?: MentoringOption[];
  deliveryModeIcons?: Record<string, string>;
  allowedSubOptions?: Record<string, string[]>;
  allowedProvinces?: string[];
  allowedSites?: string[];
  livelihoodCategories?: MentoringOption[];
}

export function useTrainingFormOptions({
  values,
  provinces = [],
  pillers = [],
  targetAudience = [],
  deliveryModes = [],
  deliveryModeIcons = {},
  allowedSubOptions,
  allowedProvinces,
  allowedSites,
  livelihoodCategories = [],
}: UseTrainingFormOptionsParams) {
  const [sessionTypes, setSessionTypes] = useState<MentoringOption[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  // Only allow user to select selected Sub options in Profile
  const filteredPillers = allowedSubOptions ? pillers.filter((p) => (allowedSubOptions[p.value]?.length ?? 0) > 0) : pillers;
  // Only allow user to select province/site coverage selected in Profile
  const filteredProvinces = allowedProvinces
    ? provinces.filter((p: any) => allowedProvinces.includes(p._id))
    : provinces;
  const filteredSites = allowedSites
    ? sites.filter((s: any) => allowedSites.includes(s._id))
    : sites;

  // Fetch session types when categories/pillar changes
  useEffect(() => {
    const init = async () => {
      if (!values.categories) {
        setSessionTypes([]);
        return;
      }
      const selectedPillarObj = pillers.find(
        (p) => p.value === values.categories || p.label === values.categories
      );
      const pillarCode = (selectedPillarObj?.value || values.categories).toLowerCase();
      if (pillarCode) {
        try {
          const res = await getSessionTypesByPillar(pillarCode);
          const allowedIds = allowedSubOptions?.[pillarCode];
          const filtered = allowedIds ? (res || []).filter((r) => allowedIds.includes(r.value)) : res;
          setSessionTypes(filtered || []);
        } catch (err) {
          console.error('Error fetching session types:', err);
          setSessionTypes([]);
        }
      } else {
        setSessionTypes([]);
      }
    };

    init();
  }, [values.categories, pillers, allowedSubOptions]);

  // Fetch sites when province changes
  useEffect(() => {
    const init = async () => {
      const rawProv = values.provinces;
      const provId = Array.isArray(rawProv) ? rawProv[0] : rawProv;
      if (!provId) {
        setSites([]);
        return;
      }
      try {
        const res = await getSitesByProvince({ provinceId: provId });
        setSites(res.result?.data || []);
      } catch (err) {
        console.error('Error fetching sites:', err);
        setSites([]);
      }
    };

    init();
  }, [values.provinces]);

  const optionsMap = useMemo(() => {
    return buildTrainingFormOptionsMap({
      provinces: filteredProvinces,
      sites: filteredSites,
      pillers: filteredPillers,
      sessionTypes,
      targetAudience,
      deliveryModes,
      deliveryModeIcons,
      livelihoodCategories,
    });
  }, [filteredProvinces, filteredSites, filteredPillers, sessionTypes, targetAudience, deliveryModes, deliveryModeIcons, livelihoodCategories]);

  return {
    sessionTypes,
    sites,
    optionsMap,
  };
}
