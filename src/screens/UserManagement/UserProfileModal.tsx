import React, { useEffect, useState, useMemo } from 'react';
import { VStack, HStack, Text, Button, ButtonText, Modal, Badge, BadgeText } from '@ui';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CREATE_USER_FORM_SCHEMA } from '@constants/CREATE_USER_FORM_SCHEMA';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince } from '../../services/usersService';
import { getUserProfile } from '../../services/authenticationService';
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
       const res = val.value ?? val.id ?? val._id ?? val.label ?? val.name;
       return res != null ? String(res) : '';
     }
     return String(val);
   };
 
   const getFieldVal = (fieldName: string): string => {
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
     if (fieldName === 'organisationId') {
       keys.push('organisation', 'organization', 'organisations', 'organizations');
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
        if (target[key] !== undefined && target[key] !== null) {
          const resolved = getValueFromObj(target[key]);
          if (resolved !== null && resolved !== undefined && resolved !== '') {
            return resolved;
          }
        }
      }
    }
    return '';
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
  const gender = getFieldVal('gender');
  const rawDob = getFieldVal('dob');
  let dob = '';
  if (rawDob) {
    const cleanDob = String(rawDob).trim();
    if (/^\d{8}$/.test(cleanDob)) {
      dob = `${cleanDob.substring(0, 4)}_${cleanDob.substring(4, 6)}_${cleanDob.substring(6, 8)}`;
    } else if (/^\d{6}$/.test(cleanDob)) {
      const d1 = parseInt(cleanDob.substring(0, 2), 10);
      const d2 = parseInt(cleanDob.substring(2, 4), 10);
      const d3 = parseInt(cleanDob.substring(4, 6), 10);
      if (d1 <= 31 && d2 <= 12) {
        const year = d3 > 50 ? `19${cleanDob.substring(4, 6)}` : `20${cleanDob.substring(4, 6)}`;
        dob = `${year}_${cleanDob.substring(2, 4)}_${cleanDob.substring(0, 2)}`;
      } else {
        const year = d1 > 50 ? `19${cleanDob.substring(0, 2)}` : `20${cleanDob.substring(0, 2)}`;
        dob = `${year}_${cleanDob.substring(2, 4)}_${cleanDob.substring(4, 6)}`;
      }
    } else if (/^\d{4}[\-\/_]\d{2}[\-\/_]\d{2}$/.test(cleanDob)) {
      dob = cleanDob.replace(/[\-\/]/g, '_');
    } else if (/^\d{2}[\-\/_]\d{2}[\-\/_]\d{4}$/.test(cleanDob)) {
      const parts = cleanDob.split(/[\-\/_]/);
      dob = `${parts[2]}_${parts[1]}_${parts[0]}`;
    } else if (/^\d{2}[\-\/_]\d{2}[\-\/_]\d{2}$/.test(cleanDob)) {
      const parts = cleanDob.split(/[\-\/_]/);
      const yVal = parseInt(parts[2], 10);
      const year = yVal > 50 ? `19${parts[2]}` : `20${parts[2]}`;
      dob = `${year}_${parts[1]}_${parts[0]}`;
    } else {
      dob = cleanDob.replace(/[\-\/]/g, '_');
    }
  }
  const employee_id = getFieldVal('employee_id');
  let organisationId = getFieldVal('organisationId');
  if (!organisationId) {
    const userOrgs = (user as any)?.user_organizations || (userProfile as any)?.user_organizations || [];
    const org = userOrgs?.[0]?.organization || userOrgs?.[0]?.organisation;
    if (org) {
      organisationId = org._id || org.id || '';
    }
  }
  const positionId = getFieldVal('positionId') || getFieldVal('position');
  const provinceId = getFieldVal('provinceId') || getFieldVal('province');
  const siteId = getFieldVal('siteId') || getFieldVal('site');
  const location = getFieldVal('location') || getFieldVal('address');

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
    const val = entityObj._id || entityObj.id || entityObj.value || '';
    const lbl = entityObj.metaInformation?.name || entityObj.name || entityObj.label || '';
    if (val && lbl) {
      return { value: String(val), label: String(lbl) };
    }
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

  const { roles, provinces, genders, organisations, positions, countryCodes } = useUserManagementFilters({});
  const [formSites, setFormSites] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && user?.id) {
      setProfileLoading(true);
      getUserProfile(user.id)
        .then(profile => {
          setSelectedUserProfile(profile);
          const provId = getEntityId(profile?.province || (user as any)?.province);
          if (provId) {
            getSitesByProvince({ provinceId: provId, page: 1, limit: 100 })
              .then(res => setFormSites(res.result?.data || []))
              .catch(() => setFormSites([]));
          } else {
            setFormSites([]);
          }
        })
        .catch(err => {
          console.error('Failed to load user profile:', err);
        })
        .finally(() => {
          setProfileLoading(false);
        });
    } else {
      setSelectedUserProfile(null);
      setFormSites([]);
    }
  }, [isOpen, user]);

  const values = useMemo(() => {
    return mapUserToFormValues(user, selectedUserProfile);
  }, [user, selectedUserProfile]);

  const flags = useMemo(() => {
    const roleId = values.roleId;
    const selRole = roles.find((r: any) => r.id.toString() === roleId);
    const roleTitle = (selRole?.title?.toLowerCase() || '');
    const roleLabel = (selRole?.label?.toLowerCase() || '');

    const userOrgs = (user as any)?.user_organizations || (selectedUserProfile as any)?.user_organizations || [];
    const directRoles = userOrgs?.[0]?.roles || [];
    const hasDirectRole = directRoles.some((r: any) => {
      const title = (r?.role?.title || '').toLowerCase();
      const label = (r?.role?.label || '').toLowerCase();
      return ['supervisor', 'org_admin', 'lc', 'linkage champion'].some(
        (k: string) => title.includes(k) || label.includes(k)
      );
    });

    const isSupervisorOrLC = hasDirectRole || ['supervisor', 'org_admin', 'lc', 'linkage champion'].some(
      (k: string) => roleTitle.includes(k) || roleLabel.includes(k)
    );
    return { isSupervisorOrLC };
  }, [values.roleId, roles, user, selectedUserProfile]);

  const profileOptions = useMemo(() => {
    const opts: Record<string, { value: string; label: string }[]> = {
      roles: [],
      genders: [],
      provinces: [],
      sites: [],
      organisations: [],
      positions: [],
    };
    if (selectedUserProfile) {
      const profile = selectedUserProfile.userDetails || selectedUserProfile;
      const gOpt = extractEntityOption(profile.gender);
      if (gOpt) opts.genders.push(gOpt);

      const pOpt = extractEntityOption(profile.province || (user as any)?.province);
      if (pOpt) opts.provinces.push(pOpt);

      const sOpt = extractEntityOption(profile.site || (user as any)?.site);
      if (sOpt) opts.sites.push(sOpt);

      const oOpt = extractEntityOption(profile.organisation || profile.organizations);
      if (oOpt) opts.organisations.push(oOpt);

      const posOpt = extractEntityOption(profile.position);
      if (posOpt) opts.positions.push(posOpt);
    }
    return opts;
  }, [selectedUserProfile, user]);

  const optionsMap = useMemo(() => {
    const mergeOptions = (sourceKey: string, fetchedList: { value: string; label: string }[]) => {
      const profileList = profileOptions[sourceKey] || [];
      const combined = [...profileList, ...fetchedList];
      const seen = new Set<string>();
      return combined.filter(o => {
        if (!o.value || seen.has(o.value)) return false;
        seen.add(o.value);
        return true;
      });
    };

    return {
      roles: mergeOptions('roles', roles.map((r: any) => ({ value: r.id.toString(), label: r.label || r.title || '' }))),
      genders: mergeOptions('genders', genders.map((g: any) => ({ value: g._id, label: g.metaInformation?.name || g.name }))),
      provinces: mergeOptions('provinces', provinces.map((p: any) => ({ value: p._id, label: p.metaInformation?.name || p.name }))),
      sites: mergeOptions('sites', formSites.map((s: any) => ({ value: s._id, label: s.metaInformation?.name || s.name }))),
      organisations: mergeOptions('organisations', organisations.map((o: any) => ({ value: o._id, label: o.metaInformation?.name || o.name }))),
      positions: mergeOptions('positions', positions.map((p: any) => ({ value: p._id, label: p.metaInformation?.name || p.name }))),
      countryCodes: (countryCodes || []).map((c: any) => ({ value: c.metaInformation?.name || c.name || '', label: c.metaInformation?.name || c.name || '' })),
    };
  }, [roles, genders, provinces, formSites, organisations, positions, countryCodes, profileOptions]);

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
              flags={flags}
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
