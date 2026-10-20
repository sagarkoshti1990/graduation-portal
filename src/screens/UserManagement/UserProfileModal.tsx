import React, { useEffect, useState, useMemo, useRef } from 'react';
import moment from 'moment';
import { VStack, HStack, Button, ButtonText, Modal, Text } from '@ui';
import { useAlert } from '@components/ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CREATE_USER_FORM_SCHEMA, INPUT_STYLE } from '@constants/CREATE_USER_FORM_SCHEMA';
import SchemaFormRenderer, { validateSchema } from '@components/SchemaFormRenderer';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';
import { getSitesByProvince, updateOrgAdminUser, } from '../../services/usersService';
import { getUserProfile } from '../../services/authenticationService';
import { updateEntityDetails } from '../../services/participantService';
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

/**
 * Resolves the role assigned to `user`/`userProfile`, tolerating the different
 * shapes this data can arrive in:
 * - account/search-shaped: `user_organizations[0].roles[0].role.{id,title,label}`
 * - AuthContext-shaped: `organizations[0].roles[0].{id,title,label}` (role fields
 *   sit directly on the role item, no nested `.role`)
 */
const resolveRoleInfo = (
  user: any,
  userProfile: any,
): { id?: string; title?: string; label?: string } | null => {
  const nestedCandidates: any[] = [
    user?.user_organizations?.[0]?.roles,
    user?.user_organizations?.[0]?.organization?.roles,
    userProfile?.user_organizations?.[0]?.roles,
    userProfile?.user_organizations?.[0]?.organization?.roles,
  ];
  const nestedOrgRoles = nestedCandidates.find(
    (arr) => Array.isArray(arr) && arr.length > 0,
  );
  if (nestedOrgRoles?.[0]?.role) {
    return nestedOrgRoles[0].role;
  }

  const directCandidates: any[] = [
    user?.organizations?.[0]?.roles,
    userProfile?.organizations?.[0]?.roles,
  ];
  const directOrgRoles = directCandidates.find(
    (arr) => Array.isArray(arr) && arr.length > 0,
  );
  if (directOrgRoles?.[0] && (directOrgRoles[0].id || directOrgRoles[0].title)) {
    return directOrgRoles[0];
  }

  return null;
};

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
  // The profile being viewed might hold a role that `roles` doesn't include
  // (e.g. a tenant_admin's own role is intentionally excluded from `roles`,
  // which is scoped to the roles a tenant_admin may assign to *other* users).
  // Track it separately so it can still be rendered/validated as a valid option.
  const [extraRoleOption, setExtraRoleOption] = useState<{
    id: string;
    title: string;
    label: string;
  } | null>(null);

  // Kept in sync with `roles` so the profile-fetch effect below can read the
  // latest value without needing `roles` in its dependency array (which would
  // otherwise force a redundant re-fetch once the async roles list resolves).
  const rolesRef = useRef(roles);
  rolesRef.current = roles;

  const effectiveRoles = useMemo(() => {
    if (!extraRoleOption) return roles;
    const alreadyPresent = roles.some(
      (r: any) => r.id?.toString() === extraRoleOption.id,
    );
    if (alreadyPresent) return roles;
    return [
      ...roles,
      {
        id: extraRoleOption.id,
        title: extraRoleOption.title,
        label: extraRoleOption.label,
        status: 'ACTIVE',
      },
    ];
  }, [roles, extraRoleOption]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValuesRef = useRef<Record<string, string>>({});
  const firstNameRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && mode === 'edit') {
      const timer = setTimeout(() => {
        firstNameRef.current?.focus?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

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

    const resolvedRoleInfo = resolveRoleInfo(user, userProfile);
    const roleId = resolvedRoleInfo?.id?.toString() ||
      resolvedRoleInfo?.title ||
      resolvedRoleInfo?.label ||
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
        const valValue = (val.value !== undefined && val.value !== null && val.value !== '') ? val.value : undefined;
        const res = valValue ?? val.metaInformation?.name ?? val.name ?? val.label ?? val.id ?? val._id;
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

      if (fieldName === 'dob') {
        keys.push('date_of_birth', 'dateOfBirth', 'birth_date', 'birthDate');
      }
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

      const profileTargets = [
        userProfile?.userDetails,
        userProfile?.userDetails?.meta,
        userProfile?.userDetails?.extra,
        userProfile,
        userProfile?.meta,
        userProfile?.extra,
        userProfile?.custom_entity_text,
      ];
      const userTargets = [
        (user as any)?.userDetails,
        (user as any)?.userDetails?.meta,
        (user as any)?.userDetails?.extra,
        user,
        (user as any)?.meta,
        (user as any)?.extra,
        (user as any)?.custom_entity_text,
      ];

      for (const target of profileTargets) {
        if (!target) continue;
        for (const key of keys) {
          if (target[key] !== undefined && target[key] !== null && target[key] !== '') {
            return target[key];
          }
        }
      }

      const isPhoneField = [
        'phoneNumber', 'phone', 'alternativePhone', 'alternatePhone',
        'countryCode', 'phoneCode', 'alternativePhoneCode', 'alternatePhoneCode'
      ].includes(fieldName);

      if (isPhoneField && userProfile) {
        return null;
      }

      for (const target of userTargets) {
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
    const rawDob = getFieldVal('dob');
    const dob = (() => {
      if (!rawDob) return '';
      const clean = rawDob.replace(/[\/\-]/g, '_');
      if (/^\d{4}_\d{2}_\d{2}$/.test(clean)) return clean;
      const parsed = moment(rawDob, ['YYYY_MM_DD', 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD/MM/YYYY', 'DD-MM-YYYY', 'DD_MM_YYYY']);
      return parsed.isValid() ? parsed.format('YYYY_MM_DD') : clean;
    })();

    const employee_id = getFieldVal('employee_id');
    let organisationId = getFieldVal('organization');
    const positionId = getFieldIdVal('positionId');
    const provinceId = getFieldIdVal('provinceId');
    const siteId = getFieldIdVal('siteId');
    const location = getFieldVal('location');

    const roleTitle = (() => {
      if (!roleId) return '';
      if (resolvedRoleInfo?.title) return resolvedRoleInfo.title.toLowerCase();
      const matchedRole = effectiveRoles.find((r: any) => r.id.toString() === roleId);
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

          // If this profile's actual role isn't in the (possibly restricted)
          // `roles` list — e.g. a tenant_admin's own role is excluded from
          // the list of roles they're allowed to assign to other users —
          // track it separately so the Role field still shows/validates correctly.
          const roleInfo = resolveRoleInfo(user, profile);
          if (roleInfo?.id && !rolesRef.current.some((r: any) => r.id?.toString() === roleInfo.id!.toString())) {
            setExtraRoleOption({
              id: roleInfo.id.toString(),
              title: roleInfo.title || '',
              label: roleInfo.label || roleInfo.title || '',
            });
          } else {
            setExtraRoleOption(null);
          }

          const mapped = mapUserToFormValues(user, profile);
          //console.log('MAPPED VALUES =>', mapped);
          setValues(mapped);
          initialValuesRef.current = mapped;

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
      initialValuesRef.current = {};
      setFormSites([]);
      setErrors({});
    }
  }, [isOpen, user]);

  const optionsMap = useMemo(
    () =>
      mapFiltersToOptionsMap({
        roles: effectiveRoles,
        genders,
        provinces,
        sites: formSites,
        organisations,
        positions,
        countryCodes,
      }),
    [
      effectiveRoles,
      genders,
      provinces,
      formSites,
      organisations,
      positions,
      countryCodes,
    ],
  );

  const handleFieldChange = (name: string, value: string) => {
    let nextValues: Record<string, string> = {};
    setValues(prev => {
      const updated = { ...prev, [name]: value };
      nextValues = updated;

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
        const selectedRole = effectiveRoles.find((r: any) => r.id.toString() === value);
        const roleTitle = (selectedRole?.title || '').toLowerCase();
        updated.isParticipant = roleTitle === 'user' ? 'true' : 'false';
      }

      return updated;
    });

    setErrors(prev => {
      const next = { ...prev };
      const validationErrs = validateSchema(
        CREATE_USER_FORM_SCHEMA,
        nextValues,
        optionsMap,
      );
      if (validationErrs[name]) {
        next[name] = validationErrs[name];
      } else {
        delete next[name];
      }
      if (name === 'roleId') {
        delete next.provinceId;
        delete next.siteId;
      }
      return next;
    });
  };

  const hasChanges = useMemo(() => {
    const initialKeys = Object.keys(initialValuesRef.current);
    const currentKeys = Object.keys(values);
    if (initialKeys.length === 0 && currentKeys.length === 0) return false;
    const allKeys = Array.from(new Set([...initialKeys, ...currentKeys]));

    return allKeys.some(key => {
      const initialVal = (initialValuesRef.current[key] ?? '').toString().trim();
      const currentVal = (values[key] ?? '').toString().trim();
      return initialVal !== currentVal;
    });
  }, [values]);

  const handleSubmit = async () => {
    if (!hasChanges) {
      return;
    }

    const validationErrors = validateSchema(
      CREATE_USER_FORM_SCHEMA,
      values,
      optionsMap,
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors({});
      setTimeout(() => {
        setErrors(validationErrors);
      }, 0);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = mapFormValuesToPayload(values, effectiveRoles);
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
              firstNameRef={firstNameRef}
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
              isDisabled={isSubmitting || !hasChanges}
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
