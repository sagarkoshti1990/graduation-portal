import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { VStack, HStack, Button, ButtonText, Modal } from '@ui';
import { useAlert } from '@components/ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CREATE_USER_FORM_SCHEMA, FormField } from '@constants/CREATE_USER_FORM_SCHEMA';
import SchemaFormRenderer, { validateSchema } from '@components/SchemaFormRenderer';
import { createUser, getSitesByProvince } from '../../services/usersService';
import { useUserManagementFilters } from '@constants/USER_MANAGEMENT';

interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isMobile: boolean;
  t: any;
}

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isMobile,
  t,
}) => {
  const { showAlert } = useAlert();
  const { roles, provinces, genders, organisations, positions, countryCodes } = useUserManagementFilters({});
  const initialValues = useMemo(() => {
    const vals: Record<string, string> = {};
    const initializeField = (field: FormField) => {
      if (field.type === 'group' && field.fields) {
        field.fields.forEach(initializeField);
      } else if (field.name) {
        vals[field.name] = field.defaultValue ?? '';
      }
    };
    CREATE_USER_FORM_SCHEMA.forEach(section => {
      section.rows.forEach(row => {
        row.fields.forEach(initializeField);
      });
    });
    return vals;
  }, []);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSites, setFormSites] = useState<any[]>([]);

  useEffect(() => {
    if (!values.provinceId) {
      setFormSites([]);
      return;
    }
    getSitesByProvince({ provinceId: values.provinceId, page: 1, limit: 100 })
      .then(res => setFormSites(res.result?.data || []))
      .catch(() => setFormSites([]));
  }, [values.provinceId]);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialValues]);

  const flags = useMemo(() => {
    const roleId = values.roleId;
    const selRole = roles.find((r: any) => r.id.toString() === roleId);
    const roleTitle = (selRole?.title?.toLowerCase() || '');
    const roleLabel = (selRole?.label?.toLowerCase() || '');
    const isSupervisorOrLC = ['supervisor', 'org_admin', 'lc', 'linkage champion'].some(
      (k: string) => roleTitle.includes(k) || roleLabel.includes(k)
    );
    return { isSupervisorOrLC };
  }, [values.roleId, roles]);

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

  const handleFieldChange = useCallback((name: string, value: string) => {
    setValues(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'email' && (prev.username === '' || prev.username === prev.email)) {
        next.username = value;
      }
      if (name === 'provinceId') next.siteId = '';
      return next;
    });
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const handleSubmit = async () => {
    const validationErrs = validateSchema(CREATE_USER_FORM_SCHEMA, values, flags);
    if (Object.keys(validationErrs).length > 0) {
      setErrors(validationErrs);
      return;
    }

    setIsSubmitting(true);
    try {
      const roleId = values.roleId;
      const selectedRole = roles.find((r: any) => r.id.toString() === roleId);
      const roleTitle = selectedRole?.title || roleId;

      const payload: any = {
        name: values.name.trim(),
        username: values.username,
        email: values.email,
        roles: roleTitle,
        // @ts-ignore - process.env is injected by webpack DefinePlugin on web
        password: process.env.DEFAULT_USER_PASSWORD || 'Password@1234',
      };

      if (values.dob) payload.dob = values.dob.replace(/[\/\-]/g, '');
      if (values.gender) payload.gender = values.gender;
      if (values.siteId) payload.site = values.siteId;
      if (values.provinceId) payload.province = values.provinceId;
      if (values.phoneNumber) payload.phone = values.phoneNumber;
      if (values.phoneNumber && values.countryCode) payload.phone_code = values.countryCode.replace('+', '');
      if (values.alternativePhone) payload.alternative_phone = values.alternativePhone;
      if (values.alternativePhone && values.alternativePhoneCode) payload.alternative_phone_code = values.alternativePhoneCode.replace('+', '');
      if (values.location) payload.location = values.location;
      if (values.nationalId) payload.national_id = Number(values.nationalId);

      if (flags.isSupervisorOrLC) {
        if (values.organisationId) payload.organisation = values.organisationId;
        if (values.positionId) payload.position = values.positionId;
        if (values.employee_id) payload.employee_id = values.employee_id;
      }

      await createUser(payload);
      showAlert('success', t('admin.users.createUser.success') || 'User created successfully.', { placement: 'bottom' });
      onSuccess();
    } catch (error: any) {
      const errMsg = (error as any)?.data?.message || (error as any)?.message || t('admin.users.createUser.error') || 'Failed to create user.';
      showAlert('error', errMsg, { placement: 'bottom' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstNameRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        firstNameRef.current?.focus?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerTitle={t('admin.users.createUser.title') || 'Create New User'}
      headerDescription={t('admin.users.createUser.description') || 'Add a new user to the system. Required fields are marked with *.'}
      showCloseButton={true}
      closeOnOverlayClick={!isSubmitting}
      style={{ zIndex: 9999 }}
    >
      <VStack space="md" width="100%">
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
          firstNameRef={firstNameRef}
        />
        <VStack space="md" width="100%">
          <HStack space="md" justifyContent="flex-end">
            <Button variant={'outlineghost' as any} onPress={onClose} isDisabled={isSubmitting}>
              <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.createUser.cancel') || 'Cancel'}</ButtonText>
            </Button>
            <Button variant="solid" action="primary" onPress={handleSubmit} isDisabled={isSubmitting}>
              <ButtonText color="$white" {...TYPOGRAPHY.bodySmall}>
                {isSubmitting ? (t('common.submitting') || 'Submitting...') : (t('admin.users.createUser.create') || 'Create User')}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </Modal>
  );
};
