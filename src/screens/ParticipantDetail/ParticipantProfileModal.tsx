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
  HStack,
  Button,
  ButtonIcon,
  ButtonText,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { profileStyles } from '@components/ui/Modal/Styles';
import { theme } from '@config/theme';
import { getParticipantsList, updateParticipantAddress } from '../../services/participantService';
import { User } from '@contexts/AuthContext';
import { STATUS, USER_STATUS } from '@constants/app.constant';
import { openDownload } from '@utils/helper';
import { usePlatform } from '@utils/platform';

type ParticipantProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  participantId:string,
  userId:string,
  onParticipantSaved: (patch: { location: string; email?: string }) => void;
};

function ParticipantProfileModalInner({
  isOpen,
  onClose,
  participantId,
  userId,
  onParticipantSaved,
}: ParticipantProfileModalProps) {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { isMobile } = usePlatform();
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [participant, setParticipant] = useState<User | undefined>();
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
  const canEditProfile =
    participant?.accountUserStatus !== USER_STATUS.INACTIVE &&
    participant?.status !== STATUS.DROPOUT;

  useEffect(() => {
    const init = async () => {
      const response = await getParticipantsList({ entityId: participantId, userId })
      const { userDetails, ...rest } = response?.result?.data?.[0]
      let participantData = { ...(userDetails || {}), ...rest, accountUserStatus: userDetails?.status }
      setParticipant(participantData);
       setEditedAddress({
        email: participantData?.email || '',
        street: participantData?.location || '',
        province: participantData?.province?.label || '',
        site: participantData?.site?.label || participantData?.site || '',
      });
    }
    if(participantId && isOpen) {
      init()
    }
  }, [participantId, userId, isOpen]);

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
        ...(field === 'email' ? { email: undefined } : { street: undefined }),
        form: undefined,
      }));
    },
    [],
  );

  const handleToggleEdit = useCallback(() => {
    if (!canEditProfile) {
      return;
    }

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
  }, [canEditProfile, participant]);

  const handleSaveAddress = useCallback(async () => {
    if (!canEditProfile) {
      return;
    }

    const street = editedAddress.street?.trim() ?? '';
    // const email = editedAddress.email?.trim() ?? '';
    // const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const nextErrors: {
      street?: string;
      // email?: string;
      form?: string;
    } = {};
    if (!street) {
      nextErrors.street = t('participantDetail.profileModal.streetRequired');
    }
    // if (!email) {
    //   nextErrors.email = t('participantDetail.profileModal.emailRequired');
    // } else if (!isValidEmail) {
    //   nextErrors.email = t('participantDetail.profileModal.emailInvalid');
    // }
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
          // email,
        },
      };
      const res = await updateParticipantAddress(reqBody);
      if (res) {
        onParticipantSaved({
          location: street,
          //  email
        });
        setIsEditingAddress(false);
        setAddressFieldErrors({});
        showAlert(
          'success',
          t('participantDetail.profileModal.addressUpdated'),
          {
            placement: 'bottom',
          },
        );
      }
    } catch {
      showAlert('error', t('common.error'), {
        placement: 'bottom',
      });
    }
  }, [
    canEditProfile,
    editedAddress,
    participant?.id,
    onParticipantSaved,
    showAlert,
    t,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTitle={t('participantDetail.profileModal.title')}
      headerDescription={t('participantDetail.profileModal.subtitle', {
        name: participant?.name,
      })}
      bodyProps={{ pb: 0 }}
      // showCloseButton={false}
      // headerRightContent={
      //   canEditProfile && <Pressable onPress={handleToggleEdit}>
      //     <LucideIcon
      //       name={isEditingAddress ? 'X' : 'Pencil'}
      //       size={16}
      //       color={theme.tokens.colors.primary500}
      //     />
      //   </Pressable>
      // }
      size={isMobile ? 'lg' : 'sm'}
      {...(!isEditingAddress
        ? {
            footerContent: <RenderFooterContent participant={participant} />,
          }
        : {
            cancelButtonText: t('common.cancel'),
            confirmButtonText: t('participantDetail.profileModal.save'),
            onCancel: handleToggleEdit,
            onConfirm: handleSaveAddress,
          })}
    >
      <VStack space="lg">
        <VStack space="xs" {...profileStyles.fieldSection}>
          <Text {...profileStyles.fieldLabel}>
            {t('common.profileFields.name')}
          </Text>
          <Text {...profileStyles.fieldValue}>{participant?.name}</Text>
        </VStack>

        <VStack space="xs" {...profileStyles.fieldSection}>
          <Text {...profileStyles.fieldLabel}>
            {t('common.profileFields.id')}
          </Text>
          <Text {...profileStyles.fieldValue}>{participant?.id}</Text>
        </VStack>

        <VStack
          space="xs"
          {...(participant?.location ? profileStyles.fieldSection : {})}
        >
          <Text {...profileStyles.fieldLabel}>
            {t('common.profileFields.contact')}
          </Text>
          <VStack space="sm">
            <Text {...profileStyles.fieldValue}>
              {participant?.phone_code || ''} {participant?.phone || ''}
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
          <HStack justifyContent="space-between">
            <Text {...profileStyles.fieldLabel}>
              {t('common.profileFields.address')}
            </Text>
            {canEditProfile && !isEditingAddress && (
              <Pressable onPress={handleToggleEdit}>
                <LucideIcon
                  name={isEditingAddress ? 'X' : 'Pencil'}
                  size={16}
                  color={theme.tokens.colors.primary500}
                />
              </Pressable>
            )}
          </HStack>
          {isEditingAddress ? (
            <VStack space="sm">
              <VStack space="xs">
                <Input
                  {...profileStyles.input}
                  $focus-borderColor={theme.tokens.colors.inputFocusBorder}
                >
                  <InputField
                    placeholder={t('common.profileFields.addressFields.street')}
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

const RenderFooterContent = ({ participant }: { participant: any }) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { isMobile } = usePlatform();
  const consentFile = getFileUrl(participant?.consentFiles);
  const slaFile = getFileUrl(participant?.slaFiles);
  
  return (
    <HStack space="sm" flex={1} flexDirection={isMobile ? 'column' : 'row'}>
      {consentFile !== '' && (
        <Button
          // @ts-ignore
          variant="outlineghost"
          {...(isMobile ? {flex:"none"} : {flex: 1})}
          onPress={() => openDownload(consentFile, t, showAlert)}
        >
          <ButtonIcon as={LucideIcon} name="FileText" />
          <ButtonText fontSize="$sm" fontWeight="$medium">
            {t('participantDetail.profileModal.viewConsent')}
          </ButtonText>
        </Button>
      )}
      {/* @ts-ignore */}
      {slaFile !== '' && (
        <Button
          // @ts-ignore
          variant="outlineghost"
          {...(isMobile ? {flex:"none"} : {flex: 1})}
          onPress={() => openDownload(slaFile, t, showAlert)}
        >
          <ButtonIcon as={LucideIcon} name="FileText" />
          <ButtonText fontSize="$sm" fontWeight="$medium">
            {t('participantDetail.profileModal.viewSLA')}
          </ButtonText>
        </Button>
      )}
    </HStack>
  );
};

const getFileUrl = (files: any) => {
  if (!Array.isArray(files) || files.length === 0) {
    return '';
  }

  const file = files.find(item => {
    // object format
    if (typeof item === 'object' && item?.url) {
      return true;
    }

    // string format
    if (typeof item === 'string' && item.trim()) {
      return true;
    }

    return false;
  });

  if (!file) {
    return '';
  }

  // return url from object
  if (typeof file === 'object') {
    return file.url || '';
  }

  // return string directly
  return file;
};
