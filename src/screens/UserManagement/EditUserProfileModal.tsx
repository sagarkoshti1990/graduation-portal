import React, { useEffect, useState, useMemo } from 'react';
import { VStack, HStack, Button, ButtonText, Modal, Text } from '@ui';
import { useAlert } from '@components/ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CREATE_USER_FORM_SCHEMA } from '@constants/CREATE_USER_FORM_SCHEMA';
import SchemaFormRenderer, { validateSchema } from '@components/SchemaFormRenderer';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince, updateOrgAdminUser } from '../../services/usersService';
import { getUserProfile } from '../../services/authenticationService';
import type { AdminUserManagementData } from '@app-types/Users';
import { ProfileModalHeader, mapUserToFormValues, getEntityId } from './UserProfileModal';




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

  const { roles, provinces, genders, organisations, positions, countryCodes } = useUserManagementFilters({});
  const [formSites, setFormSites] = useState<any[]>([]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
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
    const roleId = values.roleId || '';
    const selRole = roles.find((r: any) => r.id.toString() === roleId);
    const roleTitle = (selRole?.title?.toLowerCase() || '');
    const roleLabel = (selRole?.label?.toLowerCase() || '');

    const userOrgs = (user as any)?.user_organizations || (selectedUserProfile as any)?.user_organizations || [];
    const directRoles = userOrgs?.[0]?.roles || [];
    const hasDirectRole = directRoles.some((r: any) => {
      const title = (r?.role?.title || '').toLowerCase();
      const label = (r?.role?.label || '').toLowerCase();
      return ['supervisor', 'org_admin', 'lc', 'linkage champion', 'tenant_admin'].some(
        (k: string) => title.includes(k) || label.includes(k)
      );
    });

    const isSupervisorOrLC = hasDirectRole || ['supervisor', 'org_admin', 'lc', 'linkage champion', 'tenant_admin'].some(
      (k: string) => roleTitle.includes(k) || roleLabel.includes(k)
    );
    return { isSupervisorOrLC };
  }, [values.roleId, roles, user, selectedUserProfile]);



  const optionsMap = useMemo(() => ({
    roles: roles
      .filter((r: any) => !['admin', 'brac admin'].includes((r.label || r.title)?.toLowerCase() ?? ''))
      .map((r: any) => ({ value: r.id.toString(), label: r.label || r.title || '' })),
    genders: genders.map((g: any) => ({ value: g._id, label: g.metaInformation?.name || g.name })),
    provinces: provinces.map((p: any) => ({ value: p._id, label: p.metaInformation?.name || p.name })),
    sites: formSites.map((s: any) => ({ value: s._id, label: s.metaInformation?.name || s.name })),
    organisations: organisations.map((o: any) => ({ value: o._id, label: o.metaInformation?.name || o.name })),
    positions: positions.map((p: any) => ({ value: p._id, label: p.metaInformation?.name || p.name })),
    countryCodes: (countryCodes || []).map((c: any) => ({ value: c.metaInformation?.externalId || c.externalId || '', label: c.metaInformation?.externalId || c.externalId || '' })).sort((a, b) => parseInt(a.value) - parseInt(b.value) || a.value.localeCompare(b.value)),
  }), [roles, genders, provinces, formSites, organisations, positions, countryCodes]);



  const handleFieldChange = (name: string, value: string) => {
    setValues(prev => {
      const updated = { ...prev, [name]: value };

      // Clear site if province changes
      if (name === 'provinceId') {
        updated.siteId = '';
        const provId = getEntityId(value);
        if (provId) {
          getSitesByProvince({ provinceId: provId, page: 1, limit: 100 })
            .then(res => setFormSites(res.result?.data || []))
            .catch(() => setFormSites([]));
        } else {
          setFormSites([]);
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateSchema(CREATE_USER_FORM_SCHEMA, values, flags);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showAlert('error', t('common.validationError', 'Please correct the errors in the form.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const roleId = values.roleId;
      const selectedRole = roles.find((r: any) => r.id.toString() === roleId);
      const roleTitle = selectedRole?.title || roleId;

      const payload: any = {
        name: values.name?.trim(),
        username: values.username?.trim(),
        email: values.email?.trim(),
        roles: roleTitle,
      };

      if (values.dob && values.dob.trim()) {
        payload.dob = values.dob.replace(/[\/\-]/g, '');
      }
      if (values.gender && values.gender.trim()) {
        payload.gender = values.gender;
      }
      if (values.siteId && values.siteId.trim()) {
        payload.site = values.siteId;
      }
      if (values.provinceId && values.provinceId.trim()) {
        payload.province = values.provinceId;
      }
      if (values.phoneNumber && values.phoneNumber.trim()) {
        payload.phone = values.phoneNumber.trim();
        if (values.countryCode) {
          payload.phone_code = values.countryCode.replace('+', '');
        }
      }
      if (values.alternativePhone && values.alternativePhone.trim()) {
        payload.alternative_phone = values.alternativePhone.trim();
        if (values.alternativePhoneCode) {
          payload.alternative_phone_code = values.alternativePhoneCode.replace('+', '');
        }
      }
      if (values.location && values.location.trim()) {
        payload.location = values.location;
      }
      if (values.nationalId && values.nationalId.trim()) {
        payload.national_id = Number(values.nationalId);
      }

      if (flags.isSupervisorOrLC) {
        if (values.organisationId && values.organisationId.trim()) {
          payload.organisation = values.organisationId;
        }
        if (values.positionId && values.positionId.trim()) {
          payload.position = values.positionId;
        }
        if (values.employee_id && values.employee_id.trim()) {
          payload.employee_id = values.employee_id;
        }
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
              errors={errors}
              onFieldChange={handleFieldChange}
              optionsMap={optionsMap}
              flags={flags}
              disabled={isSubmitting}
              isMobile={isMobile}
              t={t}
            />
          </VStack>
        )}

        {/* Footer */}
        <HStack space="md" alignItems="center" justifyContent="flex-end" mt="$4">
          <Button variant={"outlineghost" as any} onPress={onClose} isDisabled={isSubmitting}>
            <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.profileModal.close', 'Close')}</ButtonText>
          </Button>
          {!profileLoading && (
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
