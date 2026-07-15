import React, { useEffect, useState, useMemo } from 'react';
import { VStack, HStack, Button, ButtonText, Modal, Text } from '@ui';
import { useAlert } from '@components/ui';
import { TabButton } from '@components/Tabs';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CREATE_USER_FORM_SCHEMA } from '@constants/CREATE_USER_FORM_SCHEMA';
import SchemaFormRenderer, { validateSchema } from '@components/SchemaFormRenderer';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince, updateOrgAdminUser } from '../../services/usersService';
import { getUserProfile } from '../../services/authenticationService';
import type { AdminUserManagementData } from '@app-types/Users';
import { ProfileModalHeader, mapUserToFormValues, extractEntityOption, getEntityId } from './UserProfileModal';

const EDITABLE_FIELDS = [
  'name',
  'nationalId',
  'countryCode',
  'phoneNumber',
  'alternativePhoneCode',
  'alternativePhone',
  'roleId',
  'gender',
  'dob',
  'employeeId',
  'organisationId',
  'positionId',
  'provinceId',
  'siteId',
  'location',
];


interface EditUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: AdminUserManagementData | null;
  isMobile: boolean;
  t: any;
}

export const EditUserProfileModal: React.FC<EditUserProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  isMobile,
  t,
}) => {
  const { showAlert } = useAlert();
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(null);
  const [editTab, setEditTab] = useState<'DETAILS' | 'ACTIVITY' | 'PERMISSIONS'>('DETAILS');

  const { roles, provinces, genders, organisations, positions, countryCodes } = useUserManagementFilters({});
  const [formSites, setFormSites] = useState<any[]>([]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      setEditTab('DETAILS');
      setProfileLoading(true);
      setSelectedUserProfile(null);
      setErrors({});
      getUserProfile(user.id)
        .then(profile => {
          setSelectedUserProfile(profile);
          const mapped = mapUserToFormValues(user, profile);
          setValues(mapped);

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
          console.error('Failed to load user profile for editing:', err);
        })
        .finally(() => {
          setProfileLoading(false);
        });
    } else {
      setSelectedUserProfile(null);
      setValues({});
      setFormSites([]);
      setErrors({});
    }
  }, [isOpen, user]);

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



  const handleFieldChange = (name: string, value: string) => {
    setValues(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'provinceId') next.siteId = '';
      return next;
    });
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    const validationErrs = validateSchema(CREATE_USER_FORM_SCHEMA, values, flags, EDITABLE_FIELDS);
    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      const firstErr = Object.values(validationErrs)[0];
      showAlert('error', firstErr);
      return;
    }

    setIsSubmitting(true);
    try {
      const roleId = values.roleId;
      const selectedRole = roles.find((r: any) => r.id.toString() === roleId);
      const roleTitle = selectedRole?.title || roleId;

      const payload: any = {
        name: values.name?.trim(),
        roles: roleTitle,
      };

      if (values.dob) {
        payload.dob = values.dob.replace(/[/\-_]/g, '');
      }
      if (values.gender) payload.gender = values.gender;
      if (values.siteId !== undefined) payload.site = values.siteId || null;
      if (values.provinceId !== undefined) payload.province = values.provinceId || null;
      if (values.phoneNumber !== undefined) payload.phone = values.phoneNumber || null;
      if (values.phoneNumber && values.countryCode) {
        payload.phone_code = values.countryCode.replace('+', '');
      }
      if (values.alternativePhone !== undefined) payload.alternative_phone = values.alternativePhone || null;
      if (values.alternativePhone && values.alternativePhoneCode) {
        payload.alternative_phone_code = values.alternativePhoneCode.replace('+', '');
      }
      if (values.location !== undefined) payload.location = values.location || null;
      if (values.nationalId !== undefined) {
        payload.national_id = values.nationalId ? Number(values.nationalId) : null;
      }

      if (flags.isSupervisorOrLC) {
        if (values.organisationId !== undefined) payload.organisation = values.organisationId || null;
        if (values.positionId !== undefined) payload.position = values.positionId || null;
        if (values.employeeId !== undefined) payload.employee_id = values.employeeId || null;
      }

      await updateOrgAdminUser(user!.id, payload);
      showAlert('success', t('admin.users.edit.success', 'User updated successfully.'));
      onSuccess();
    } catch (error: any) {
      showAlert('error', error?.message || t('common.somethingWentWrong', 'Something went wrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showCloseButton={true}
      closeOnOverlayClick={!isSubmitting}
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
              isActive={editTab === tab.key}
              onPress={(tabKey) => setEditTab(tabKey as any)}
              variant="ButtonTab"
            />
          ))}
        </HStack>

        {/* Content */}
        {profileLoading ? (
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" py="$4">
            {t('common.loading', 'Loading...')}
          </Text>
        ) : editTab !== 'DETAILS' ? (
          <VStack space="sm" alignItems="center" py="$8">
            <Text {...TYPOGRAPHY.h4} color="$textForeground">
              {t('common.comingSoon', 'Coming Soon')}
            </Text>
            <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
              {editTab === 'ACTIVITY'
                ? t('admin.users.profileModal.activityComingSoonDescription', 'Activity logs are coming soon.')
                : t('admin.users.profileModal.permissionsComingSoonDescription', 'Permission controls are coming soon.')}
            </Text>
          </VStack>
        ) : (
          <VStack space="lg" alignItems="stretch">
            <SchemaFormRenderer
              schema={CREATE_USER_FORM_SCHEMA}
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
              optionsMap={optionsMap}
              flags={flags}
              disabled={isSubmitting}
              isMobile={isMobile}
              t={t}
              editableFields={EDITABLE_FIELDS}
            />
          </VStack>
        )}

        {/* Footer */}
        <HStack space="md" alignItems="center" justifyContent="flex-end" mt="$4">
          <Button variant={"outlineghost" as any} onPress={onClose} isDisabled={isSubmitting}>
            <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.profileModal.close', 'Close')}</ButtonText>
          </Button>
          {editTab === 'DETAILS' && !profileLoading && (
            <Button variant="solid" action="primary" onPress={handleSubmit} isDisabled={isSubmitting}>
              <ButtonText color="$white" {...TYPOGRAPHY.bodySmall}>
                {isSubmitting ? t('common.submitting', 'Submitting...') : t('admin.users.profileModal.saveChanges', 'Save Changes')}
              </ButtonText>
            </Button>
          )}
        </HStack>
      </VStack>
    </Modal>
  );
};
