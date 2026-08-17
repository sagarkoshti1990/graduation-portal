import React from 'react';
import { Box, Text, Pressable, LucideIcon, useAlert } from '@ui';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import { FeatureCardProps } from '@app-types/components';
import styles from '../../styles';
import { FORM_MODE } from '@constants/SUPPORT_PROVIDER_CARDS';
import { useProfileCompletion } from '@hooks';

const getIconBgColor = (color: string): string => {
  switch (color) {
    case '#0284C7':
      return '#E0F2FE'; // Light blue
    case '#7C3AED':
      return '#F3E8FF'; // Light purple
    case '#16A34A':
      return '#DCFCE7'; // Light green
    default:
      return '#F3F4F6'; // Default light gray
  }
};

export const SupportCard: React.FC<FeatureCardProps> = ({ card }) => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { title, description, icon, color, navigationUrl } = card;
  const { isProfileComplete, checkingProfile } = useProfileCompletion();

  const isDisabled = !checkingProfile && !isProfileComplete;

  const handlePress = () => {
    if (isDisabled) {
      showAlert(
        'error',
        t(
          'profile.incompleteWarning',
          'Please Complete your Profile before proceeding.',
        ),
      );
      return;
    }
    if (!navigationUrl) return;
    if (navigationUrl === 'form-training-session') {
      navigation.navigate(navigationUrl as never, { type: FORM_MODE.CREATE } as never);
    } else {
      navigation.navigate(navigationUrl as never);
    }
  };

  return (
    <Pressable
      {...styles.pressable}
      opacity={isDisabled ? 0.5 : 1}
      onPress={handlePress}
    >
      {/* Icon Circle */}
      <Box
        w={68}
        h={68}
        borderRadius="$full"
        bg={getIconBgColor(color)}
        justifyContent="center"
        alignItems="center"
        mb="$5"
      >
        <LucideIcon
          name={icon}
          size={32}
          color={color}
        />
      </Box>

      {/* Title */}
      <Text
        fontSize="$xl"
        fontWeight="$bold"
        color="$textLight900"
        textAlign="center"
        mb="$2"
      >
        {t(title)}
      </Text>

      {/* Description */}
      <Text
        fontSize="$md"
        color="$textLight500"
        textAlign="center"
        lineHeight="$md"
      >
        {t(description)}
      </Text>
    </Pressable>
  );
};

export default SupportCard;
