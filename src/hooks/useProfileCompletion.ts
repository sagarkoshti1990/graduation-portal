import { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getUserProfile } from '../services/authenticationService';
import { useLanguage } from '@contexts/LanguageContext';
import { useAlert } from '@ui';

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);
  const [checkingProfile, setCheckingProfile] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkCompletion = async () => {
      if (!user?.id) {
        if (isMounted) {
          setIsProfileComplete(false);
          setCheckingProfile(false);
        }
        return;
      }

      try {
        setCheckingProfile(true);
        const res: any = await getUserProfile(user.id);
        const profileData = res || {};

        const getField = (key: string, fallback: any = null) => {
          const val =
            profileData[key] ??
            profileData?.meta?.[key] ??
            profileData?.extra?.[key] ??
            profileData?.userDetails?.[key] ??
            profileData?.userDetails?.meta?.[key] ??
            profileData?.userDetails?.extra?.[key] ??
            profileData?.custom_entity_text?.[key];
          return val === undefined || val === null ? fallback : val;
        };

        const rawCov = getField('provinceCoverage', []);
        const rawCat = getField('supportCategories', []);

        let cov = [];
        if (rawCov) {
          if (typeof rawCov === 'object') cov = rawCov;
          else {
            try { cov = JSON.parse(rawCov); } catch { cov = []; }
          }
        }

        let cat = [];
        if (rawCat) {
          if (typeof rawCat === 'object') cat = rawCat;
          else {
            try { cat = JSON.parse(rawCat); } catch { cat = []; }
          }
        }

        const hasCoverage = Array.isArray(cov) && cov.length > 0;
        const hasCategories = Array.isArray(cat) && cat.length > 0;

        if (isMounted) {
          setIsProfileComplete(hasCoverage && hasCategories);
        }
      } catch (err) {
        console.error('Error checking profile completion:', err);
        if (isMounted) setIsProfileComplete(false);
      } finally {
        if (isMounted) setCheckingProfile(false);
      }
    };

    checkCompletion();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return { isProfileComplete, checkingProfile };
};

export const useRequireProfileCompletion = () => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { isProfileComplete, checkingProfile } = useProfileCompletion();

  useEffect(() => {
    if (!checkingProfile && !isProfileComplete) {
      showAlert(
        'error',
        t(
          'profile.incompleteWarning',
          'Please Complete your Profile before proceeding.',
        ),
      );
    }
  }, [checkingProfile, isProfileComplete]);

  return { isProfileComplete, checkingProfile };
};


