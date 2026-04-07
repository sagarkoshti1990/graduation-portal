import React, { useEffect, useState } from 'react';
import { Box, HStack, Pressable, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { useAuth, User } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import Modal from '@components/ui/Modal';
import { useAlert } from '@components/ui/Alert';
import LucideIcon from '@components/ui/LucideIcon';
import { profileStyles, LCProfileStyles } from '@components/ui/Modal/Styles';
import { getUserProfile } from '../../services/authenticationService';
import { stylesHeader } from './Styles';

interface LcProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LcProfileModal: React.FC<LcProfileModalProps> = ({ isOpen, onClose }) => {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const userProfile = await getUserProfile();
        if (isMounted) {
          setAuthUser(userProfile);
        }
      } catch (error: any) {
        if (isMounted) {
          showAlert('error', error?.message || t('common.somethingWentWrong'));
          onClose();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, onClose, showAlert, t]);

  const languageCodes =
    Array.isArray(authUser?.languages) && authUser.languages.filter(Boolean).length > 0
      ? (authUser.languages.filter(Boolean) as string[])
      : ['en'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTitle={t('lcProfile.myProfile')}
      headerDescription={t('lcProfile.linkageChampionProfile')}
      headerIcon={
        <Box {...stylesHeader.headerIcon}>
          <LucideIcon name="User" size={24} color="#ffffff" />
        </Box>
      }
      size="lg"
    >
      {isLoading ? (
        <Box py="$8" alignItems="center" justifyContent="center">
          <Spinner size="large" color="$primary500" />
        </Box>
      ) : (
        <VStack {...LCProfileStyles.lcProfileCard} $md-p="$6">
          <Box {...LCProfileStyles.lcFieldWrapper} $md-flexDirection="row" $md-gap="$6">
            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="User" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.fullName')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text {...profileStyles.fieldLabel} flexShrink={1}>
                  {authUser?.name || user?.name}
                </Text>
              </Box>
            </Box>

            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="Award" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.lcId')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text {...profileStyles.fieldLabel} flexShrink={1}>
                  {authUser?.id || '-'}
                </Text>
              </Box>
            </Box>

            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="Mail" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.emailAddress')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text {...profileStyles.fieldLabel} flexShrink={1}>
                  {authUser?.email || '-'}
                </Text>
              </Box>
            </Box>

            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="Phone" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.phoneNumber')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text {...profileStyles.fieldLabel} flexShrink={1}>
                  {`${authUser?.phone_code || ''} ${authUser?.phone || ''}`.trim() || '-'}
                </Text>
              </Box>
            </Box>

            <Box width="$full">
              <HStack mb="$2" space="sm">
                <LucideIcon name="MapPin" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.serviceArea')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text {...profileStyles.fieldValue} color="$textMutedForeground">
                  {t('common.profileFields.addressFields.site')}: {authUser?.site?.label || '-'}
                </Text>
              </Box>
            </Box>

            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <LucideIcon name="Calendar" size={16} color={theme.tokens.colors.textMutedForeground} />
                <Text {...profileStyles.fieldValue}>{t('lcProfile.startDate')}</Text>
              </HStack>
              <Box {...LCProfileStyles.lcValueField} width="$full" overflow="hidden">
                <Text {...profileStyles.fieldLabel} flexShrink={1}>
                  {authUser?.created_at
                    ? new Date(authUser.created_at).toLocaleDateString('en-GB')
                    : '-'}
                </Text>
              </Box>
            </Box>

            <Box {...LCProfileStyles.lcItem} $md-width="auto">
              <HStack mb="$2" space="sm">
                <Text {...profileStyles.fieldValue}>{t('lcProfile.languagePreference')}</Text>
              </HStack>
              <HStack space="sm">
                {languageCodes.map(langCode => {
                  const isActive = currentLanguage === langCode;
                  return (
                    <Pressable key={langCode} onPress={() => changeLanguage(langCode)}>
                      <Box
                        {...profileStyles.languageButton}
                        {...(isActive
                          ? profileStyles.languageButtonActive
                          : profileStyles.languageButtonInactive)}
                      >
                        <Text
                          {...profileStyles.languageButtonText}
                          {...(isActive
                            ? profileStyles.languageButtonTextActive
                            : profileStyles.languageButtonTextInactive)}
                        >
                          {t(`languages.${langCode}`)}
                        </Text>
                      </Box>
                    </Pressable>
                  );
                })}
              </HStack>
            </Box>
          </Box>
        </VStack>
      )}
    </Modal>
  );
};

export default LcProfileModal;
