import React, { useRef, useEffect } from 'react';
import { VStack, HStack, Text, Box, Button, ButtonText } from '@ui';
import { LucideIcon } from '@ui/index';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CREATE_USER_FORM_SCHEMA } from '@constants/CREATE_USER_FORM_SCHEMA';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import type { OptionsMap, FlagsMap } from '@components/SchemaFormRenderer';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateUserFormProps {
  isMobile: boolean;
  t: any;
  /** Pre-normalized options map: keys match schema's `optionsSource` values */
  optionsMap: OptionsMap;
  /** Runtime flags for conditional visibility (e.g. isSupervisorOrLC) */
  flags: FlagsMap;
  /** Current field values keyed by field name */
  values: Record<string, string>;
  /** Current field errors keyed by field name */
  errors: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
  isCreateUserSubmitting: boolean;
  isCreateUserModalOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  isMobile,
  t,
  optionsMap,
  flags,
  values,
  errors,
  onFieldChange,
  isCreateUserSubmitting,
  isCreateUserModalOpen,
  onClose,
  onSubmit,
}) => {
  const firstNameRef = useRef<any>(null);

  // Auto-focus the first field when the modal opens
  useEffect(() => {
    if (isCreateUserModalOpen) {
      const timer = setTimeout(() => {
        firstNameRef.current?.focus?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCreateUserModalOpen]);

  return (
    <VStack key={isCreateUserModalOpen ? 'open' : 'closed'} space="md" width="100%">
      {/* Schema-driven form fields */}
      <SchemaFormRenderer
        schema={CREATE_USER_FORM_SCHEMA}
        values={values}
        errors={errors}
        onFieldChange={onFieldChange}
        optionsMap={optionsMap}
        flags={flags}
        disabled={isCreateUserSubmitting}
        isMobile={isMobile}
        t={t}
        firstNameRef={firstNameRef}
      />

      {/* Footer */}
      <VStack space="md" width="100%">
        {/* <Box bg="$background50" p="$3" borderRadius="$md" mb="$2">
          <HStack space="xs" alignItems="flex-start">
            <LucideIcon name="Info" size={14} color="$textMutedForeground" style={{ marginTop: 2 }} />
            <Text {...TYPOGRAPHY.caption} color="$textMutedForeground" flex={1}>
              {t('admin.users.createUser.passwordNote')}
            </Text>
          </HStack>
        </Box> */}

        <HStack space="md" justifyContent="flex-end">
          <Button variant={'outlineghost' as any} onPress={onClose} isDisabled={isCreateUserSubmitting}>
            <ButtonText {...TYPOGRAPHY.bodySmall}>{t('admin.users.createUser.cancel') || 'Cancel'}</ButtonText>
          </Button>
          <Button variant="solid" action="primary" onPress={onSubmit} isDisabled={isCreateUserSubmitting}>
            <ButtonText color="$white" {...TYPOGRAPHY.bodySmall}>
              {isCreateUserSubmitting
                ? t('common.submitting') || 'Submitting...'
                : t('admin.users.createUser.create') || 'Create User'}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </VStack>
  );
};
