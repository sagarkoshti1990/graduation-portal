import React, { useState } from 'react';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FeatureCardProps } from '@app-types/components';
import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useLanguage } from '@contexts/LanguageContext';
import { LucideIcon } from '@ui/index';
const FeatureCard: React.FC<FeatureCardProps> = ({ card }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    color,
    icon,
    title,
    description,
    navigationUrl,
    isDisabled = false,
    pressableActionText,
    isComingSoon = false,
  } = card;

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      if (isComingSoon) {
        setShowTooltip(true);
      } else if (!isDisabled) {
        setIsHovered(true);
      }
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
      setShowTooltip(false);
    }
  };

  const handlePress = () => {
    if (navigationUrl && !isDisabled && !isComingSoon) {
      // @ts-ignore - Navigation type inference
      navigation.navigate(navigationUrl);
    }
  };

  const isClickDisabled = isDisabled || isComingSoon;
  const cardOpacity = isClickDisabled ? 0.5 : 1;

  return (
    <Box position="relative" flex={1}>
      {/* Tooltip for Coming Soon */}
      {isComingSoon && showTooltip && Platform.OS === 'web' && (
        <Box
          position="absolute"
          bottom="100%"
          left="50%"
          mb="$2"
          zIndex={1000}
          $web-style={{
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        >
          <Box
            bg="$textDark900"
            px="$3"
            py="$2"
            borderRadius="$md"
            $web-style={{
              whiteSpace: 'nowrap',
            }}
          >
            <Text color="$white" fontSize="$sm" fontWeight="$medium">
              {t('common.comingSoon') || 'Coming Soon'}
            </Text>
          </Box>
        </Box>
      )}

      <TouchableOpacity
        onPress={handlePress}
        disabled={isClickDisabled}
        activeOpacity={isComingSoon ? 1 : 0.7}
        style={{ opacity: cardOpacity, flex: 1 }}
      >
        <Box
          bg={theme.tokens.colors.backgroundPrimary.light}
          borderRadius="$lg"
          borderTopWidth={4}
          borderTopColor={color}
          shadowColor={theme.tokens.colors.foreground}
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.1}
          shadowRadius={8}
          elevation={3}
          $web-boxShadow={
            isHovered && !isComingSoon
              ? '0px 8px 24px rgba(0, 0, 0, 0.15)'
              : '0px 2px 8px rgba(0, 0, 0, 0.1)'
          }
          minHeight={250}
          flex={1}
          $web-transition="all 0.3s ease-in-out"
          $web-transform={isHovered && !isComingSoon ? 'scale(1.05)' : 'scale(1)'}
          $web-cursor={isClickDisabled ? 'not-allowed' : 'pointer'}
          // @ts-ignore - Web-specific event handlers
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
        {/* Card Content */}
        <VStack space="md" padding="$5" justifyContent="space-between" flex={1}>
          <VStack space="md">
            {/* Icon Container */}
            <Box
              bg={color}
              borderRadius="$xl"
              width={64}
              height={64}
              alignItems="center"
              justifyContent="center"
            >
              {/* Render Lucide icon */}
              <LucideIcon name={icon} size={32} color="white" />
            </Box>

            {/* Title */}
            <Text {...TYPOGRAPHY.h4} color={theme.tokens.colors.foreground}>
              {t(title)}
            </Text>

            {/* Description */}
            <Text
              {...TYPOGRAPHY.paragraph}
              color={theme.tokens.colors.mutedForeground}
              numberOfLines={2}
            >
              {t(description)}
            </Text>
          </VStack>

          {/* Get Started Link - Only visible on hover for enabled cards */}
          {Platform.OS === 'web' && pressableActionText && !isComingSoon && (
            <Box
              flexDirection="row"
              alignItems="center"
              gap="$1"
              marginTop="$3"
              opacity={isHovered ? 1 : 0}
              $web-transition="opacity 0.3s ease-in-out"
            >
              <Text fontSize="$sm" fontWeight="$semibold" color={color}>
                {t(pressableActionText)}
              </Text>
              <Text fontSize="$sm" fontWeight="$semibold" color={color}>
                {'>'}
              </Text>
            </Box>
          )}

          {/* Coming Soon Badge */}
          {isComingSoon && (
            <Box
              position="absolute"
              top="$4"
              right="$4"
              bg="$warning500"
              px="$2"
              py="$1"
              borderRadius="$sm"
            >
              <Text fontSize="$xs" fontWeight="$semibold" color="$white">
                {t('common.comingSoon') || 'Coming Soon'}
              </Text>
            </Box>
          )}
        </VStack>
        </Box>
      </TouchableOpacity>
    </Box>
  );
};

export default FeatureCard;
