import { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getUserProfile } from '../services/authenticationService';
import { useLanguage } from '@contexts/LanguageContext';
import { useAlert } from '@ui';

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const getField = (data: any, key: string) => {
    const paths = [
      data,
      data?.meta,
      data?.extra,
      data?.userDetails,
      data?.userDetails?.meta,
      data?.userDetails?.extra,
      data?.custom_entity_text,
    ];
    for (const p of paths) {
      if (p?.[key] != null) return p[key];
    }
    return null;
  };

  const toArray = (val: any): any[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  useEffect(() => {
    let isMounted = true;
    const checkCompletion = async () => {
      if (!user?.id) {
        if (isMounted) setIsProfileComplete(false);
        return;
      }

      try {
        const profileData = (await getUserProfile(user.id)) || {};

        const cov = toArray(getField(profileData, 'provinceCoverage'));
        const cat = toArray(getField(profileData, 'supportCategories'));

        if (isMounted) {
          setIsProfileComplete(cov.length > 0 && cat.length > 0);
        }
      } catch (err) {
        console.error('Error checking profile completion:', err);
        if (isMounted) setIsProfileComplete(false);
      }
    };

    checkCompletion();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return { isProfileComplete };
};


