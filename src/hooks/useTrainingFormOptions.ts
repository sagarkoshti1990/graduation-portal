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
}

export function useTrainingFormOptions({
  values,
  provinces = [],
  pillers = [],
  targetAudience = [],
  deliveryModes = [],
  deliveryModeIcons = {},
  allowedSubOptions,
}: UseTrainingFormOptionsParams) {
  const [sessionTypes, setSessionTypes] = useState<MentoringOption[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  // Only allow user to select selected Sub options in Profile
  const filteredPillers = allowedSubOptions ? pillers.filter((p) => (allowedSubOptions[p.value]?.length ?? 0) > 0) : pillers;

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
      if (!values.provinces) {
        setSites([]);
        return;
      }
      try {
        const res = await getSitesByProvince({ provinceId: values.provinces });
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
      provinces,
      sites,
      pillers: filteredPillers,
      sessionTypes,
      targetAudience,
      deliveryModes,
      deliveryModeIcons,
    });
  }, [provinces, sites, filteredPillers, sessionTypes, targetAudience, deliveryModes, deliveryModeIcons]);

  return {
    sessionTypes,
    sites,
    optionsMap,
  };
}
