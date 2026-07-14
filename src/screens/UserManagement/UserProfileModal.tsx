import React, { useEffect, useState, useMemo } from 'react';
import { VStack, HStack, Text, Button, ButtonText, Modal, Badge, BadgeText } from '@ui';
import { LucideIcon } from '@ui/index';
import { TabButton } from '@components/Tabs';
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
 
   const roles = (user as any)?.user_organizations?.[0]?.roles || [];
   const roleId = roles[0]?.role?.id?.toString() || (user as any)?.roleId?.toString() || '';
 
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
      if (fieldName === 'employeeId') {
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
  const dob = rawDob ? String(rawDob).replace(/[\-\/]/g, '_') : '';
  const employeeId = getFieldVal('employeeId');
  const organisationId = getFieldVal('organisationId');
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
    employeeId,
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
  const [profileTab, setProfileTab] = useState<'DETAILS' | 'ACTIVITY' | 'PERMISSIONS'>('DETAILS');

  const { roles, provinces, genders, organisations, positions, countryCodes } = useUserManagementFilters({});
  const [formSites, setFormSites] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && user?.id) {
      setProfileTab('DETAILS');
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

  // Remove the temporary password note row for view profile
  const viewSchema = useMemo(() => {
    return CREATE_USER_FORM_SCHEMA.map(section => ({
      ...section,
      rows: section.rows.map(row => ({
        ...row,
        fields: row.fields.filter(field => field.type !== 'note')
      })).filter(row => row.fields.length > 0)
    })).filter(section => section.rows.length > 0);
  }, []);

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
        {/* Tabs */}
        <HStack bg="$bgSidebar" borderRadius="$lg" p="$1" space="xs">
          {([
            { key: 'DETAILS', label: 'admin.users.details' },
            { key: 'ACTIVITY', label: 'admin.users.activity' },
            { key: 'PERMISSIONS', label: 'admin.users.permissions' },
          ] as const).map(tab => (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={profileTab === tab.key}
              onPress={(tabKey) => setProfileTab(tabKey as any)}
              variant="ButtonTab"
            />
          ))}
        </HStack>

        {/* Content */}
        {profileLoading ? (
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" py="$4">
            {t('common.loading', 'Loading...')}
          </Text>
        ) : profileTab !== 'DETAILS' ? (
          <VStack space="sm" alignItems="center" py="$8">
            <Text {...TYPOGRAPHY.h4} color="$textForeground">
              {t('common.comingSoon', 'Coming Soon')}
            </Text>
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
              {profileTab === 'ACTIVITY'
                ? t('admin.users.profileModal.activityComingSoonDescription', 'Activity logs are coming soon.')
                : t('admin.users.profileModal.permissionsComingSoonDescription', 'Permission controls are coming soon.')}
            </Text>
          </VStack>
        ) : (
          <VStack space="lg" alignItems="stretch">
            <SchemaFormRenderer
              schema={viewSchema}
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
