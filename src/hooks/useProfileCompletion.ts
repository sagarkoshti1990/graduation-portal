import { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getUserProfile } from '../services/authenticationService';
import { getMentoringProfile } from '../services/mentoringService';
import { MENTORING_ENTITY_TYPES } from '@constants/SP_MENU_OPTIONS';

// Get Pillers Sub Options
const SUB_OPTION_GROUPS = [
  MENTORING_ENTITY_TYPES.SOCIAL_EMPOWERMENT,
  MENTORING_ENTITY_TYPES.FINANCIAL_INCLUSION,
  MENTORING_ENTITY_TYPES.LIVELIHOODS,
  MENTORING_ENTITY_TYPES.SPECIAL_ATTENTION,
  MENTORING_ENTITY_TYPES.IMMEDIATE_ATTENTION,
  MENTORING_ENTITY_TYPES.ASSET_TYPES,
] as const;

const toId = (entry: any): string => (entry && typeof entry === 'object' ? entry.value : entry);

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [allowedSubOptions, setAllowedSubOptions] = useState<Record<string, string[]>>({});
  const [allowedProvinces, setAllowedProvinces] = useState<string[]>([]);
  const [allowedSites, setAllowedSites] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const checkCompletion = async () => {
      if (!user?.id) {
        if (isMounted) {
          setAllowedCategories([]);
          setAllowedSubOptions({});
          setAllowedProvinces([]);
          setAllowedSites([]);
        }
        return;
      }

      try {
        let profileData: any = {};
        try {
          const mentoringProfileRes = await getMentoringProfile();
          if (mentoringProfileRes?.result) {
            profileData = mentoringProfileRes.result;
          }
        } catch (mErr) {
          // No mentoring profile yet (e.g. 404) - fall back below.
        }

        if (!profileData || Object.keys(profileData).length === 0) {
          profileData = (await getUserProfile(user.id)) || {};
        }
        
        const meta = profileData?.meta || {};

        // Mentoring profile stores `provinces`/`sites` arrays; a plain user profile (e.g. org_admin)
        // stores a single `province`/`site`, either as an id or an entity object.
        const toIdList = (...candidates: any[]): string[] => {
          const raw = candidates.find((c) => c !== undefined && c !== null && c !== '' && !(Array.isArray(c) && c.length === 0));
          if (raw === undefined) return [];
          return (Array.isArray(raw) ? raw : [raw])
            .map((entry: any) => (entry && typeof entry === 'object' ? entry._id || entry.id || entry.value : entry))
            .filter(Boolean);
        };
        const provinceIds = toIdList(profileData.provinces, meta.provinces, profileData.province, meta.province);
        const siteIds = toIdList(profileData.sites, meta.sites, profileData.site, meta.site);

        // Extract categories
        let cats: string[] = [];
        if (Array.isArray(profileData.categories) && profileData.categories.length > 0) {
          cats = profileData.categories;
        }

        const subOptions: Record<string, string[]> = {};
        SUB_OPTION_GROUPS.forEach((group) => {
          const raw = profileData[group] ?? meta[group];
          subOptions[group] = Array.isArray(raw) ? raw.map(toId) : [];
        });

        if (isMounted) {
          setAllowedCategories(cats);
          setAllowedSubOptions(subOptions);
          setAllowedProvinces(provinceIds);
          setAllowedSites(siteIds);
        }
      } catch (err) {
        console.error('Error checking profile completion:', err);
        if (isMounted) {
          setAllowedCategories([]);
          setAllowedSubOptions({});
          setAllowedProvinces([]);
          setAllowedSites([]);
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    setIsProfileLoading(true);
    checkCompletion();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const isCardAllowed = (cardId?: string): boolean => {
    if (!cardId || !allowedCategories || allowedCategories.length === 0) return false;
    return allowedCategories.includes(cardId);
  };

  const getAllowedSubOptionIds = (groupKey?: string): string[] => {
    if (!groupKey) return [];
    return allowedSubOptions[groupKey] || [];
  };

  return {
    isProfileLoading,
    allowedCategories,
    isCardAllowed,
    allowedSubOptions,
    getAllowedSubOptionIds,
    allowedProvinces,
    allowedSites,
  };
};


