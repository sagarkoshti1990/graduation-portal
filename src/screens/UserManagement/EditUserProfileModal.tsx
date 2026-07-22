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
import { mapFormValuesToPayload, mapFiltersToOptionsMap } from './CreateUserForm';




interface EditUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: AdminUserManagementData | null;
  isMobile: boolean;
  t: any;
  mode?: 'edit' | 'preview';
}

export const EditUserProfileModal: React.FC<EditUserProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  isMobile,
  t,
  mode = 'edit',
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

  const optionsMap = useMemo(() => mapFiltersToOptionsMap({
    roles,
    genders,
    provinces,
    sites: formSites,
    organisations,
    positions,
    countryCodes,
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
    const validationErrors = validateSchema(CREATE_USER_FORM_SCHEMA, values, optionsMap);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showAlert('error', t('common.validationError', 'Please correct the errors in the form.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = mapFormValuesToPayload(values, roles);

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
              disabled={isSubmitting}
              mode={mode}
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
