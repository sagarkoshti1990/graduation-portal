import React, { useEffect, useState, useMemo } from 'react';
import { VStack, HStack, Button, ButtonText, Modal, Text } from '@ui';
import { useAlert } from '@components/ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CREATE_USER_FORM_SCHEMA, INPUT_STYLE } from '@constants/CREATE_USER_FORM_SCHEMA';
import SchemaFormRenderer, { validateSchema, } from '@components/SchemaFormRenderer';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince, updateOrgAdminUser, } from '../../services/usersService';
import { getUserProfile } from '../../services/authenticationService';
import type { AdminUserManagementData } from '@app-types/Users';
import { ProfileModalHeader } from './CreateUserForm';
// import { mapUserToFormValues, getEntityId } from './UserProfileModal';
import {
  mapFormValuesToPayload,
  mapFiltersToOptionsMap,
} from './CreateUserForm';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: AdminUserManagementData | null;
  isMobile: boolean;
  t: any;
  mode?: 'edit' | 'preview';
  onEdit?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  isMobile,
  t,
  mode = 'edit',
  onEdit,
}) => {
  const { showAlert } = useAlert();
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | null>(
    null,
  );

  const { roles, provinces, genders, organisations, positions, countryCodes } =
    useUserManagementFilters({});
  const [formSites, setFormSites] = useState<any[]>([]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editSchema = useMemo(
    () =>
      CREATE_USER_FORM_SCHEMA.map(section => {
        const { hint, ...sectionWithoutHint } = section;
        return {
          ...sectionWithoutHint,
          ...(mode === 'edit' && { hint }),
          rows: section.rows.map(row => ({
            ...row,
            fields: row.fields.map(field =>
              field.name === 'roleId'
                ? { ...field, disabled: mode === 'edit' }
                : field
            ),
          })),
        };
      }),
    [mode],
  );

  const getEntityId = (value: any): string => {
    if (!value) return '';

    if (typeof value === 'string') return value;

    return value.id || value._id || value.value || '';
  };

  const mapUserToFormValues = (
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
        const res = val.value ?? val.metaInformation?.name ?? val.name ?? val.label ?? val.id ?? val._id;
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
    let organisationId = getFieldVal('organization');
    const positionId = getFieldIdVal('positionId');
    const provinceId = getFieldIdVal('provinceId');
    const siteId = getFieldIdVal('siteId');
    const location = getFieldVal('location');

    const roleTitle = (() => {
      if (!roleId) return '';
      const matchedRole = roles.find((r: any) => r.id.toString() === roleId);
      return (matchedRole?.title || '').toLowerCase();
    })();

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
      isParticipant: roleTitle === 'user' ? 'true' : 'false',
    };
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      setProfileLoading(true);
      setSelectedUserProfile(null);
      setErrors({});
      getUserProfile(user.id)
        .then(profile => {
          //console.log('PROFILE API =>', profile);
          setSelectedUserProfile(profile);

          const mapped = mapUserToFormValues(user, profile);
          //console.log('MAPPED VALUES =>', mapped);
          setValues(mapped);

          const provId = getEntityId(
            profile?.province || (user as any)?.province,
          );
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

  const optionsMap = useMemo(
    () =>
      mapFiltersToOptionsMap({
        roles,
        genders,
        provinces,
        sites: formSites,
        organisations,
        positions,
        countryCodes,
      }),
    [
      roles,
      genders,
      provinces,
      formSites,
      organisations,
      positions,
      countryCodes,
    ],
  );

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

      if (name === 'roleId') {
        const selectedRole = roles.find((r: any) => r.id.toString() === value);
        const roleTitle = (selectedRole?.title || '').toLowerCase();
        updated.isParticipant = roleTitle === 'user' ? 'true' : 'false';
      }

      return updated;
    });

    setErrors(prev => {
      const next = { ...prev, [name]: '' };
      if (name === 'roleId') {
        next.provinceId = '';
        next.siteId = '';
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const validationErrors = validateSchema(
      CREATE_USER_FORM_SCHEMA,
      values,
      optionsMap,
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showAlert(
        'error',
        t('common.validationError', 'Please correct the errors in the form.'),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = mapFormValuesToPayload(values, roles);

      await updateOrgAdminUser(user!.id, payload);
      showAlert(
        'success',
        t('admin.users.edit.success', 'User updated successfully.'),
      );
      onSuccess();
    } catch (error: any) {
      showAlert(
        'error',
        error?.message ||
        t('common.somethingWentWrong', 'Something went wrong'),
      );
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
    //   headerContent={
    //   <VStack space="xs">
    //     <Text {...TYPOGRAPHY.bodySmall}>
    //       {selectedUserProfile?.firstName || ''}
    //       {' '}
    //       {selectedUserProfile?.lastName || ''}
    //     </Text>

    //     <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
    //       {selectedUserProfile?.email || ''}
    //     </Text>
    //   </VStack>
    // }
    >
      <VStack space="md" width="100%" px="$1">
        {/* Content */}
        {profileLoading ? (
          <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" py="$4">
            {t('common.loading', 'Loading...')}
          </Text>
        ) : (
          <VStack space="lg" alignItems="stretch">
            <SchemaFormRenderer
              schema={editSchema}
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
              optionsMap={optionsMap}
              disabled={isSubmitting}
              mode={mode}
              t={t}
              _input={INPUT_STYLE}
            />
          </VStack>
        )}

        {/* Footer */}
        <HStack space="md" alignItems="center" justifyContent="flex-end" mt="$4">
          <Button variant={'outlineghost' as any} onPress={onClose} isDisabled={isSubmitting}>
            <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.profileModal.close', 'Close')}</ButtonText>
          </Button>
          {!profileLoading && mode === "preview" && onEdit && (
            <Button
              variant="solid"
              action="primary"
              onPress={onEdit}
            >
              <ButtonText color="$white" {...TYPOGRAPHY.bodySmall}>
                {t('admin.users.profileModal.editProfile', 'Edit Profile')}
              </ButtonText>
            </Button>
          )}
          {!profileLoading && mode === "edit" && (
            <Button
              variant="solid"
              action="primary"
              onPress={handleSubmit}
              isDisabled={isSubmitting}
            >
              <ButtonText color="$white" {...TYPOGRAPHY.bodySmall}>
                {isSubmitting
                  ? t('common.submitting', 'Submitting...')
                  : t('admin.users.profileModal.saveChanges', 'Save Changes')}
              </ButtonText>
            </Button>
          )}
        </HStack>
      </VStack>
    </Modal>
  );
};
