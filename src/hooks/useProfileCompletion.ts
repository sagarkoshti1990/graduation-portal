import { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { getUserProfile } from '../services/authenticationService';

const areFieldsComplete = (data: any, keys: string[]): boolean => {
  return keys.every((key) => {
    const value = data?.meta?.[key];

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return false;
  });
};

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkCompletion = async () => {
      if (!user?.id) {
        if (isMounted) setIsProfileComplete(false);
        return;
      }

      try {
        const profileData = (await getUserProfile(user.id)) || {};
        const result = areFieldsComplete(profileData, ['provinceCoverage', 'supportCategories']);
        if (isMounted) setIsProfileComplete(result);
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


