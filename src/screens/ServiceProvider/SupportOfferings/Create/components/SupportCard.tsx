import React from 'react';
import { Box, Text, Pressable, LucideIcon } from '@ui';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import { FeatureCardProps } from '@app-types/components';
import styles from '../../styles';

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
  const { title, description, icon, color, navigationUrl } = card;

  return (
    <Pressable
      flex={1}
      minWidth={280}
      bg="$white"
      p="$8"
      borderRadius="$2xl"
      borderWidth={2}
      borderColor="$borderLight100"
      $hover-borderColor="$primary500"
      $hover-shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.05}
      shadowRadius={10}
      elevation={2}
      alignItems="center"
      justifyContent="center"
      onPress={() => navigationUrl && navigation.navigate(navigationUrl as never)}
      style={styles.pressable as any}
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
