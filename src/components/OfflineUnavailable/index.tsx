import React from 'react';
import { VStack, Text, Box, Pressable, HStack } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';

interface OfflineUnavailableProps {
  /** True when the API has no offline support configured. */
  offlineSupported?: boolean;
  /** Called on "Go Back" tap — falls back to navigation.goBack() when omitted. */
  onBack?: () => void;
}

/**
 * Rendered when the device is offline and data cannot be served.
 *
 * Two scenarios:
 *   offlineSupported=false → "This page is not available offline"
 *   offlineSupported=true  → "Data has not been downloaded"
 */
const OfflineUnavailable: React.FC<OfflineUnavailableProps> = ({
  offlineSupported = false,
  onBack,
}) => {
  const { t } = useLanguage();
  const navigation = useNavigation();

  const messageKey = offlineSupported
    ? 'offlineSync.dataNotDownloaded'
    : 'offlineSync.pageUnavailableOffline';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <VStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$white"
      p="$6"
      space="lg"
    >
      <Box
        backgroundColor="$backgroundLight100"
        borderRadius="$full"
        p="$4"
      >
        <LucideIcon name="WifiOff" size={40} color="#6B7280" />
      </Box>

      <VStack alignItems="center" space="sm">
        <Text
          fontSize="$lg"
          fontWeight="$semibold"
          color="$textLight900"
          textAlign="center"
        >
          {t(messageKey)}
        </Text>
      </VStack>

      <Pressable
        onPress={handleBack}
        backgroundColor="$primary600"
        borderRadius="$md"
        px="$6"
        py="$3"
      >
        <HStack space="xs" alignItems="center">
          <LucideIcon name="ArrowLeft" size={16} color="white" />
          <Text color="white" fontWeight="$medium" fontSize="$sm">
            {t('offlineSync.goBack')}
          </Text>
        </HStack>
      </Pressable>
    </VStack>
  );
};

export default OfflineUnavailable;
