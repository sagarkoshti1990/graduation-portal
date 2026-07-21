import React, { useEffect, useState, useMemo } from 'react';
import { VStack, HStack, Text, Button, ButtonText, Modal, Badge, BadgeText } from '@ui';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CREATE_USER_FORM_SCHEMA } from '@constants/CREATE_USER_FORM_SCHEMA';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { getUserProfile } from '../../services/authenticationService';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { mapFiltersToOptionsMap } from './CreateUserForm';
import type { AdminUserManagementData } from '@app-types/Users';
import { RoleBadge } from './UsersTableConfig';

export const getEntityId = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.length > 0 ? getEntityId(val[0]) : '';
    }
    const id = val._id || val.id || val.value;
    return id ? String(id) : '';
  }
  return String(val);
};

export const mapUserToFormValues = (
  user: AdminUserManagementData | null,
  userProfile: any | null
 ): Record<string, string> => {
   if (!user) return {};
 
   const orgRoles = (user as any)?.user_organizations?.[0]?.roles || 
                    (user as any)?.user_organizations?.[0]?.organization?.roles || 
                    (userProfile as any)?.user_organizations?.[0]?.roles || 
                    (userProfile as any)?.user_organizations?.[0]?.organization?.roles || [];
   const roleId = orgRoles[0]?.role?.id?.toString() || 
                  orgRoles[0]?.role?.title || 
                  orgRoles[0]?.role?.label ||
                  (user as any)?.roleId?.toString() || 
                  (user as any)?.role || 
                  (userProfile as any)?.roleId?.toString() || 
                  (userProfile as any)?.role?.id?.toString() || 
                  (userProfile as any)?.role?.title || 
                  (userProfile as any)?.role || 
                  '';
 
   const getValueFromObj = (val: any): string | null => {
     if (val == null) return null;
     if (typeof val === 'object') {
       if (Array.isArray(val)) {
         if (val.length === 0) return null;
         return getValueFromObj(val[0]);
       }
       if (val.value === 'other') {
         return val.label != null ? String(val.label) : '';
       }
       const res = val.metaInformation?.name ?? val.name ?? val.label ?? val.value ?? val.id ?? val._id;
       return res != null ? String(res) : '';
     }
     return String(val);
   };

   const getRawFieldVal = (fieldName: string): any => {
     const keys = [fieldName];
     const snake = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
     const camel = fieldName.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
     if (!keys.includes(snake)) keys.push(snake);
     if (!keys.includes(camel)) keys.push(camel);

     if (fieldName === 'countryCode') {
       keys.push('phone_code', 'phoneCode');
     }
     if (fieldName === 'alternativePhoneCode') {
       keys.push('alternative_phone_code', 'alternativePhoneCode', 'alternate_phone_code', 'alternatePhoneCode');
     }
     if (fieldName === 'alternativePhone') {
       keys.push('alternative_phone', 'alternativePhone', 'alternate_phone', 'alternatePhone');
     }
     if (fieldName === 'organisationId' || fieldName === 'organisation') {
       keys.push('organisation', 'organization', 'organisations', 'organizations', 'organisationId');
     }
     if (fieldName === 'positionId' || fieldName === 'position') {
       keys.push('position', 'positionId', 'positions');
     }
     if (fieldName === 'provinceId' || fieldName === 'province') {
       keys.push('province', 'provinceId', 'provinces');
     }
     if (fieldName === 'siteId' || fieldName === 'site') {
       keys.push('site', 'siteId', 'sites');
     }
     if (fieldName === 'employee_id' || fieldName === 'employeeId') {
       keys.push('employee_id', 'employeeId', 'emp_id', 'empId');
     }
     if (fieldName === 'address' || fieldName === 'location') {
       keys.push('address', 'location');
     }

     const targets = [
       userProfile?.userDetails,
       userProfile?.userDetails?.meta,
       userProfile?.userDetails?.extra,
       userProfile,
       userProfile?.meta,
       userProfile?.extra,
       userProfile?.custom_entity_text,
       (user as any)?.userDetails,
       (user as any)?.userDetails?.meta,
       (user as any)?.userDetails?.extra,
       user,
       (user as any)?.meta,
       (user as any)?.extra,
       (user as any)?.custom_entity_text,
     ];

     for (const target of targets) {
       if (!target) continue;
       for (const key of keys) {
         if (target[key] !== undefined && target[key] !== null && target[key] !== '') {
           return target[key];
         }
       }
     }
     return null;
   };

   const getFieldVal = (fieldName: string): string => {
     const raw = getRawFieldVal(fieldName);
     return getValueFromObj(raw) || '';
   };

   const getFieldIdVal = (fieldName: string): string => {
     const raw = getRawFieldVal(fieldName);
     return getEntityId(raw) || '';
   };

   const formatPhoneCode = (code: string) => {
     if (!code) return '+27';
     const clean = code.trim();
     if (!clean) return '+27';
     return clean.startsWith('+') ? clean : `+${clean}`;
   };

   const name = getFieldVal('name') || user.name || '';
   const email = getFieldVal('email') || user.email || '';
   const username = getFieldVal('username') || (user as any)?.username || '';
   const nationalId = getFieldVal('nationalId');
   const countryCode = formatPhoneCode(getFieldVal('countryCode'));
   const phoneNumber = getFieldVal('phoneNumber') || getFieldVal('phone');
   const alternativePhoneCode = formatPhoneCode(getFieldVal('alternativePhoneCode'));
   const alternativePhone = getFieldVal('alternativePhone');
   const gender = getFieldIdVal('gender');
   const dob = getFieldVal('dob');
   
   const employee_id = getFieldVal('employee_id');
   let organisationId = getFieldIdVal('organisationId');
   if (!organisationId) {
     const userOrgs = (user as any)?.user_organizations || (userProfile as any)?.user_organizations || [];
     const org = userOrgs?.[0]?.organization || userOrgs?.[0]?.organisation;
     if (org) {
       organisationId = getEntityId(org);
     }
   }
   const positionId = getFieldIdVal('positionId');
   const provinceId = getFieldIdVal('provinceId');
   const siteId = getFieldIdVal('siteId');
   const location = getFieldVal('location');

   return {
     name,
     email,
     username,
     nationalId,
     countryCode,
     phoneNumber,
     alternativePhoneCode,
     alternativePhone,
     roleId,
     gender,
     dob,
     employee_id,
     organisationId,
     positionId,
     provinceId,
     siteId,
     location,
   };
 };

export const extractEntityOption = (entityObj: any) => {
  if (!entityObj) return null;
  if (Array.isArray(entityObj)) {
    if (entityObj.length === 0) return null;
    entityObj = entityObj[0];
  }
  if (typeof entityObj === 'object') {
    const lbl = entityObj.metaInformation?.name || entityObj.name || entityObj.label || '';
    const val = entityObj._id || entityObj.id || entityObj.value || lbl;
    if (val || lbl) {
      return { value: String(val || lbl), label: String(lbl || val) };
    }
  }
  if (typeof entityObj === 'string') {
    return { value: entityObj, label: entityObj };
  }
  return null;
};

interface ProfileModalHeaderProps {
  selectedUserBase: AdminUserManagementData | null;
  selectedUserProfile: any | null;
  isMobile: boolean;
  t: (key: string, fallback?: string) => string;
}

export const ProfileModalHeader: React.FC<ProfileModalHeaderProps> = ({
  selectedUserBase,
  selectedUserProfile,
  isMobile,
  t,
}) => {
  const roles =
    (selectedUserBase as any)?.user_organizations?.[0]?.roles
      ?.map((r: any) => r?.role?.label)
      .filter(Boolean) || [];

  const profileRole =
    typeof (selectedUserProfile as any)?.role === 'string'
      ? (selectedUserProfile as any)?.role
      : (selectedUserProfile as any)?.role?.label;

  const roleLabel =
    roles[0] ||
    profileRole ||
    selectedUserBase?.role ||
    t('admin.users.profileModal.defaultRole', 'User');

  const badges = (
    <HStack space="sm" alignItems="center" justifyContent="flex-end" flexShrink={0}>
      <RoleBadge role={roleLabel} />
      <Badge
        bg={(String(selectedUserBase?.status || selectedUserProfile?.status || '').toLowerCase() === 'active')
          ? '$success600'
          : '$textMutedForeground'}
        borderRadius="$md"
        px="$2"
        py="$0.5"
      >
        <BadgeText color="$white" fontSize="$xs" textTransform="none">
          {(String(selectedUserBase?.status || selectedUserProfile?.status || '').toLowerCase() === 'active')
            ? t('admin.filters.active', 'Active')
            : t('admin.filters.deactivated', 'Deactivated')}
        </BadgeText>
      </Badge>
    </HStack>
  );

  if (isMobile) {
    return (
      <VStack space="sm" flex={1} flexShrink={1}>
        <VStack space="xs">
          <Text {...TYPOGRAPHY.h1} color="$textForeground">
            {selectedUserProfile?.name || selectedUserBase?.name || '-'}
          </Text>
          <HStack space="xs" alignItems="center">
            <LucideIcon name="Mail" size={14} color="$textMutedForeground" />
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
              {selectedUserProfile?.email || selectedUserBase?.email || '-'}
            </Text>
          </HStack>
        </VStack>
        {badges}
      </VStack>
    );
  }

  return (
    <HStack alignItems="center" justifyContent="space-between" flex={1} flexShrink={1} pr="$8" gap="$2">
      <VStack space="xs" flex={1} flexShrink={1}>
        <Text {...TYPOGRAPHY.h1} color="$textForeground" numberOfLines={1}>
          {selectedUserProfile?.name || selectedUserBase?.name || '-'}
        </Text>
        <HStack space="xs" alignItems="center">
          <LucideIcon name="Mail" size={14} color="$textMutedForeground" />
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" numberOfLines={1}>
            {selectedUserProfile?.email || selectedUserBase?.email || '-'}
          </Text>
        </HStack>
      </VStack>
      {badges}
    </HStack>
  );
};

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserManagementData | null;
  isMobile: boolean;
  t: any;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  isMobile,
  t,
}) => {
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      setProfileLoading(true);
      getUserProfile(user.id)
        .then(profile => {
          setSelectedUserProfile(profile);
        })
        .catch(err => {
          console.error('Failed to load user profile:', err);
        })
        .finally(() => {
          setProfileLoading(false);
        });
    } else {
      setSelectedUserProfile(null);
    }
  }, [isOpen, user]);

  const values = useMemo(() => {
    return mapUserToFormValues(user, selectedUserProfile);
  }, [user, selectedUserProfile]);

  const {
    roles,
    genders,
    provinces,
    sites,
    organisations,
    positions,
    countryCodes,
  } = useUserManagementFilters({});

  const optionsMap = useMemo(() => {
    const baseMap = mapFiltersToOptionsMap({
      roles,
      genders,
      provinces,
      sites,
      organisations,
      positions,
      countryCodes,
    });

    const getSingleOption = (obj: any) => {
      const opt = extractEntityOption(obj);
      return opt ? [opt] : [];
    };

    const profile = selectedUserProfile?.userDetails || selectedUserProfile || {};
    
    const orgRoles = (user as any)?.user_organizations?.[0]?.roles || 
                     (user as any)?.user_organizations?.[0]?.organization?.roles || 
                     (selectedUserProfile as any)?.user_organizations?.[0]?.roles || 
                     (selectedUserProfile as any)?.user_organizations?.[0]?.organization?.roles || [];
    const roleLabel = orgRoles[0]?.role?.label || 
                      orgRoles[0]?.role?.title || 
                      (user as any)?.role || 
                      (selectedUserProfile as any)?.role?.label || 
                      (selectedUserProfile as any)?.role?.title || 
                      (selectedUserProfile as any)?.role || 
                      '';

    const roleVal = values.roleId || '';

    return {
      ...baseMap,
      roles: roleVal && roleLabel ? [{ value: roleVal, label: roleLabel }] : baseMap.roles,
      genders: baseMap.genders.length ? baseMap.genders : getSingleOption(profile.gender || (user as any)?.gender),
      provinces: baseMap.provinces.length ? baseMap.provinces : getSingleOption(profile.province || (user as any)?.province),
      sites: baseMap.sites.length ? baseMap.sites : getSingleOption(profile.site || (user as any)?.site),
      organisations: baseMap.organisations.length ? baseMap.organisations : getSingleOption(profile.organisation || profile.organizations),
      positions: baseMap.positions.length ? baseMap.positions : getSingleOption(profile.position),
    };
  }, [roles, genders, provinces, sites, organisations, positions, countryCodes, selectedUserProfile, user, values.roleId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={true}
      contentProps={{ bg: '$white' }}
      headerContent={
        <ProfileModalHeader
          selectedUserBase={user}
          selectedUserProfile={selectedUserProfile}
          isMobile={isMobile}
          t={t}
        />
      }
    >
      <VStack space="md" width="100%">
        {/* Content */}
        {profileLoading ? (
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" py="$4">
            {t('common.loading', 'Loading...')}
          </Text>
        ) : (
          <VStack space="lg" alignItems="stretch">
            <SchemaFormRenderer
              schema={CREATE_USER_FORM_SCHEMA}
              values={values}
              errors={{}}
              onFieldChange={() => {}}
              optionsMap={optionsMap}
              viewMode={true}
              isMobile={isMobile}
              t={t}
            />
          </VStack>
        )}

        {/* Footer */}
        <HStack space="md" alignItems="center" justifyContent="flex-end" mt="$4">
          <Button variant={"outlineghost" as any} onPress={onClose}>
            <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.profileModal.close', 'Close')}</ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Modal>
  );
};
