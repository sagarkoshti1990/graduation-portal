import React, { memo, useEffect, useState } from 'react';
import { Box, HStack, VStack, Text, Button, ButtonText, Avatar, AvatarFallbackText } from '@ui';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import moment from 'moment';
import { getUserProfile } from '../../services/authenticationService';
import { stylesHeader, participantAvatarWebStyle } from './Styles';
import { participantProfileModalStyles } from './ParticipantProfileModal.Styles';
import { usePlatform } from '@utils/platform';

interface ParticipantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ParticipantProfileModal: React.FC<ParticipantProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = usePlatform();
  const [profileData, setProfileData] = useState<any>(null);

  const fieldGroupStyle = isMobile
    ? { ...participantProfileModalStyles.fieldGroup, ...participantProfileModalStyles.fieldGroupMobile }
    : participantProfileModalStyles.fieldGroup;
  const labelRowStyle = isMobile
    ? { ...participantProfileModalStyles.labelRow, ...participantProfileModalStyles.labelRowMobile }
    : participantProfileModalStyles.labelRow;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        if (isMounted && data) {
          setProfileData(data);
        }
      } catch {
        // Fall back to AuthContext user
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const currentUser = profileData || user;

  const safeRenderString = (val: any): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'string' || typeof val === 'number') {
      const s = String(val).trim();
      return s || '-';
    }
    if (typeof val === 'object') {
      if (typeof val.label === 'string' && val.label.trim()) return val.label.trim();
      if (typeof val.value === 'string' && val.value.trim()) return val.value.trim();
      if (typeof val.name === 'string' && val.name.trim()) return val.name.trim();
      return '-';
    }
    return '-';
  };

  let formattedDob = '-';
  const rawDobVal = currentUser?.dob;
  if (rawDobVal) {
    const rawDob = safeRenderString(rawDobVal);
    if (rawDob !== '-') {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDob)) {
        formattedDob = rawDob;
      } else {
        const normalizedDob = rawDob.replace(/_/g, '-');
        const parsed = moment(normalizedDob);
        formattedDob = parsed.isValid() ? parsed.format('DD/MM/YYYY') : rawDob;
      }
    }
  }

  const name = safeRenderString(currentUser?.name);
  const userIdStr = safeRenderString(currentUser?.id || currentUser?.userId);
  const formatPhoneCode = (code: string) => {
    if (!code || code === '-') return '';
    const trimmed = String(code).trim();
    if (!trimmed || trimmed === '-') return '';
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  };

  const phoneCodeStr = safeRenderString(currentUser?.phone_code);
  const phoneStr = safeRenderString(currentUser?.phone);
  const formattedPhoneCode = formatPhoneCode(phoneCodeStr);
  const fullPhone = phoneStr !== '-'
    ? `${formattedPhoneCode}${formattedPhoneCode ? ' ' : ''}${phoneStr}`.trim()
    : '-';
  const email = safeRenderString(currentUser?.email);
  const address = safeRenderString(currentUser?.location);
  const province = safeRenderString(currentUser?.province);
  const site = safeRenderString(currentUser?.site);
  const altPhoneCodeStr = safeRenderString(currentUser?.alternative_phone_code || currentUser?.phone_code);
  const altPhoneStr = safeRenderString(currentUser?.alternative_phone || currentUser?.alternativePhone || currentUser?.emergencyContact);
  const formattedAltPhoneCode = formatPhoneCode(altPhoneCodeStr);
  const emergencyContact = altPhoneStr !== '-'
    ? `${formattedAltPhoneCode}${formattedAltPhoneCode ? ' ' : ''}${altPhoneStr}`.trim()
    : '-';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerTitle=""
      size="md"
      bodyProps={{ pt: '$0', pb: '$0' }}
      contentProps={isMobile ? participantProfileModalStyles.mobileContent : undefined}
      footerContent={
        <HStack {...participantProfileModalStyles.footerContainer}>
          <Button
            {...participantProfileModalStyles.closeButton}
            onPress={onClose}
            variant="outlineghost"
          >
            <ButtonText {...participantProfileModalStyles.closeButtonText}>
              {t('common.close')}
            </ButtonText>
          </Button>
        </HStack>
      }
    >
      <VStack space="md">
        {/* Header Avatar and Name/ID */}
        <HStack {...participantProfileModalStyles.headerSection}>
          <Avatar
            {...stylesHeader.userAvatar}
            $web-style={participantAvatarWebStyle}
          >
            <AvatarFallbackText> </AvatarFallbackText>
            <Box {...participantProfileModalStyles.avatarIconBox}>
              <LucideIcon name="User" size={20} color="#fff" />
            </Box>
          </Avatar>
          <VStack {...participantProfileModalStyles.headerInfo}>
            <Text {...participantProfileModalStyles.nameText}>
              {name}
            </Text>
            <Text {...participantProfileModalStyles.idText}>
              {userIdStr}
            </Text>
          </VStack>
        </HStack>

        {/* Fields list */}
        <VStack {...fieldGroupStyle}>
          <HStack {...labelRowStyle}>
            <LucideIcon name="Phone" size={16} color={theme.tokens.colors.textMutedForeground} />
            <Text {...participantProfileModalStyles.fieldLabel}>
              {t('common.profileFields.phoneNumber') || 'Phone Number'}
            </Text>
          </HStack>
          <Box {...participantProfileModalStyles.valueField}>
            <Text {...participantProfileModalStyles.fieldValue}>
              {fullPhone}
            </Text>
          </Box>
        </VStack>

        <VStack {...fieldGroupStyle}>
          <HStack {...labelRowStyle}>
            <LucideIcon name="Mail" size={16} color={theme.tokens.colors.textMutedForeground} />
            <Text {...participantProfileModalStyles.fieldLabel}>
              {t('common.profileFields.email') || 'Email Address'}
            </Text>
          </HStack>
          <Box {...participantProfileModalStyles.valueField}>
            <Text {...participantProfileModalStyles.fieldValue}>
              {email}
            </Text>
          </Box>
        </VStack>

        <VStack {...fieldGroupStyle}>
          <HStack {...labelRowStyle}>
            <LucideIcon name="Calendar" size={16} color={theme.tokens.colors.textMutedForeground} />
            <Text {...participantProfileModalStyles.fieldLabel}>
              {t('common.profileFields.dob') || 'Date of Birth'}
            </Text>
          </HStack>
          <Box {...participantProfileModalStyles.valueField}>
            <Text {...participantProfileModalStyles.fieldValue}>
              {formattedDob}
            </Text>
          </Box>
        </VStack>

        <VStack {...fieldGroupStyle}>
          <HStack {...labelRowStyle}>
            <LucideIcon name="MapPin" size={16} color={theme.tokens.colors.textMutedForeground} />
            <Text {...participantProfileModalStyles.fieldLabel}>
              {t('common.profileFields.address') || 'Address'}
            </Text>
          </HStack>
          <Box {...participantProfileModalStyles.valueField}>
            <Text {...participantProfileModalStyles.fieldValue}>
              {address}
            </Text>
          </Box>
        </VStack>

        <VStack {...fieldGroupStyle}>
          <HStack {...labelRowStyle}>
            <LucideIcon name="MapPin" size={16} color={theme.tokens.colors.textMutedForeground} />
            <Text {...participantProfileModalStyles.fieldLabel}>
              {t('common.profileFields.addressFields.province') || 'Province'}
            </Text>
          </HStack>
          <Box {...participantProfileModalStyles.valueField}>
            <Text {...participantProfileModalStyles.fieldValue}>
              {province}
            </Text>
          </Box>
        </VStack>

        <VStack {...fieldGroupStyle}>
          <HStack {...labelRowStyle}>
            <LucideIcon name="MapPin" size={16} color={theme.tokens.colors.textMutedForeground} />
            <Text {...participantProfileModalStyles.fieldLabel}>
              {t('common.profileFields.addressFields.site') || 'Site'}
            </Text>
          </HStack>
          <Box {...participantProfileModalStyles.valueField}>
            <Text {...participantProfileModalStyles.fieldValue}>
              {site}
            </Text>
          </Box>
        </VStack>

        <VStack {...fieldGroupStyle}>
          <HStack {...labelRowStyle}>
            <LucideIcon name="UserCheck" size={16} color={theme.tokens.colors.textMutedForeground} />
            <Text {...participantProfileModalStyles.fieldLabel}>
              {t('common.profileFields.emergencyContact') || 'Emergency Contact'}
            </Text>
          </HStack>
          <Box {...participantProfileModalStyles.valueField}>
            <Text {...participantProfileModalStyles.fieldValue}>
              {emergencyContact}
            </Text>
          </Box>
        </VStack>
      </VStack>
    </Modal>
  );
};

export default memo(ParticipantProfileModal);
