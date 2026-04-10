import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  VStack,
  Input,
  InputField,
  Pressable,
  Text,
  Modal,
  LucideIcon,
  useAlert,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { profileStyles } from '@components/ui/Modal/Styles';
import { theme } from '@config/theme';
import { updateParticipantAddress } from '../../services/participantService';
import { User } from '@contexts/AuthContext';

type ParticipantProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  participant: User;
  isWeb: boolean;
  onParticipantSaved: (patch: { location: string; email: string }) => void;
};

function ParticipantProfileModalInner({
  isOpen,
  onClose,
  participant,
  isWeb,
  onParticipantSaved,
}: ParticipantProfileModalProps) {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editedAddress, setEditedAddress] = useState({
    email: '',
    street: '',
    province: '',
    site: '',
  });
  const [addressFieldErrors, setAddressFieldErrors] = useState<{
    street?: string;
    email?: string;
    form?: string;
  }>({});

  useEffect(() => {
    if (participant && isOpen) {
      setEditedAddress({
        email: participant?.email || '',
        street: participant?.location || '',
        province: participant?.province?.label || '',
        site: participant?.site?.label || participant?.site || '',
      });
    }
  }, [participant, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditingAddress(false);
      setAddressFieldErrors({});
    }
  }, [isOpen]);

  const handleAddressFieldChange = useCallback(
    (field: 'email' | 'street', value: string) => {
      const next = value ?? '';
      setEditedAddress(prev =>
        field === 'email'
          ? { ...prev, email: next }
          : { ...prev, street: next },
      );
      setAddressFieldErrors(prev => ({
        ...prev,
        ...(field === 'email'
          ? { email: undefined }
          : { street: undefined }),
        form: undefined,
      }));
    },
    [],
  );

  const handleToggleEdit = useCallback(() => {
    setIsEditingAddress(editing => {
      if (editing) {
        setEditedAddress({
          email: participant?.email || '',
          street: participant?.location || '',
          province: participant?.province?.label || '',
          site: participant?.site?.label || participant?.site || '',
        });
        setAddressFieldErrors({});
      }
      return !editing;
    });
  }, [participant]);

  const handleSaveAddress = useCallback(async () => {
    const street = editedAddress.street?.trim() ?? '';
    const email = editedAddress.email?.trim() ?? '';
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const nextErrors: {
      street?: string;
      email?: string;
      form?: string;
    } = {};
    if (!street) {
      nextErrors.street = t('participantDetail.profileModal.streetRequired');
    }
    if (!email) {
      nextErrors.email = t('participantDetail.profileModal.emailRequired');
    } else if (!isValidEmail) {
      nextErrors.email = t('participantDetail.profileModal.emailInvalid');
    }
    if (Object.keys(nextErrors).length > 0) {
      setAddressFieldErrors(nextErrors);
      return;
    }

    setAddressFieldErrors({});

    try {
      const programId = process.env.GLOBAL_LC_PROGRAM_ID;
      if (!programId) {
        setAddressFieldErrors({
          form: t('participantDetail.profileModal.saveConfigurationError'),
        });
        return;
      }
      const reqBody = {
        entityId: String(participant?.id),
        programId,
        updateData: {
          location: street,
          email,
        },
      };
      const res = await updateParticipantAddress(reqBody);
      if (res) {
        onParticipantSaved({ location: street, email });
        setIsEditingAddress(false);
        setAddressFieldErrors({});
        showAlert('success', t('participantDetail.profileModal.addressUpdated'), {
          placement: 'bottom',
        });
      }
    } catch {
      showAlert('error', t('common.error'), {
        placement: 'bottom',
      });
    }
  }, [editedAddress, participant?.id, onParticipantSaved, showAlert, t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTitle={t('participantDetail.profileModal.title')}
      headerDescription={t('participantDetail.profileModal.subtitle', {
        name: participant?.name,
      })}
      showCloseButton={false}
      headerRightContent={
        <Pressable onPress={handleToggleEdit}>
          <LucideIcon
            name={isEditingAddress ? 'X' : 'Pencil'}
            size={16}
            color={theme.tokens.colors.primary500}
          />
        </Pressable>
      }
      size={isWeb ? 'sm' : 'lg'}
      cancelButtonText={t('common.cancel')}
      confirmButtonText={
        isEditingAddress ? t('participantDetail.profileModal.save') : undefined
      }
      onCancel={onClose}
      onConfirm={handleSaveAddress}
    >
      <VStack space="lg">
        <VStack space="xs" {...profileStyles.fieldSection}>
          <Text {...profileStyles.fieldLabel}>
            {t('common.profileFields.name')}
          </Text>
          <Text {...profileStyles.fieldValue}>{participant!.name}</Text>
        </VStack>

        <VStack space="xs" {...profileStyles.fieldSection}>
          <Text {...profileStyles.fieldLabel}>
            {t('common.profileFields.id')}
          </Text>
          <Text {...profileStyles.fieldValue}>{participant!.id}</Text>
        </VStack>

        <VStack
          space="xs"
          {...(participant!.location ? profileStyles.fieldSection : {})}
        >
          <Text {...profileStyles.fieldLabel}>
            {t('common.profileFields.contact')}
          </Text>
          <VStack space="sm">
            <Text {...profileStyles.fieldValue}>
              {participant!.phone_code || ''} {participant!.phone || ''}
            </Text>
            {/* {isEditingAddress ? (
              <VStack space="sm">
                <VStack space="xs">
                  <Input
                    {...profileStyles.input}
                    $focus-borderColor={theme.tokens.colors.inputFocusBorder}
                  >
                    <InputField
                      placeholder={t('common.profileFields.email')}
                      value={editedAddress?.email ?? ''}
                      onChangeText={value =>
                        handleAddressFieldChange('email', value)
                      }
                    />
                  </Input>
                  {addressFieldErrors.email ? (
                    <Text size="xs" color="$error600" mt="$1">
                      {addressFieldErrors.email}
                    </Text>
                  ) : null}
                </VStack>
              </VStack>
            ) : ( */}
              <Text {...profileStyles.fieldValue}>
                {editedAddress?.email || '-'}
              </Text>
            {/* )} */}
          </VStack>
        </VStack>

        <VStack space="xs" {...profileStyles.fieldSection}>
          <Text {...profileStyles.fieldLabel}>
            {t('common.profileFields.address')}
          </Text>
          {isEditingAddress ? (
            <VStack space="sm">
              <VStack space="xs">
                <Input
                  {...profileStyles.input}
                  $focus-borderColor={theme.tokens.colors.inputFocusBorder}
                >
                  <InputField
                    placeholder={t(
                      'common.profileFields.addressFields.street',
                    )}
                    value={editedAddress?.street || ''}
                    onChangeText={value =>
                      handleAddressFieldChange('street', value)
                    }
                  />
                </Input>
                {addressFieldErrors.street ? (
                  <Text size="xs" color="$error600" mt="$1">
                    {addressFieldErrors.street}
                  </Text>
                ) : null}
                {addressFieldErrors.form ? (
                  <Text size="xs" color="$error600" mt="$1">
                    {addressFieldErrors.form}
                  </Text>
                ) : null}
              </VStack>
            </VStack>
          ) : (
            <Text {...profileStyles.fieldValue}>
              {participant?.location || '-'}
            </Text>
          )}
          <Text
            {...profileStyles.fieldValue}
            color={'$textMutedForeground' as const}
          >
            {t('common.profileFields.addressFields.province')}:{' '}
            {participant?.province?.label || '-'}
          </Text>
          <Text
            {...profileStyles.fieldValue}
            color={'$textMutedForeground' as const}
          >
            {t('common.profileFields.addressFields.site')}:{' '}
            {participant?.site?.label || '-'}
          </Text>
        </VStack>
      </VStack>
    </Modal>
  );
}

export const ParticipantProfileModal = memo(ParticipantProfileModalInner);
