import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { Box, VStack, HStack, Text, Button, ButtonText, ScrollView, useAlert } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';

interface RawDataPanelProps {
  data: unknown;
  loading?: boolean;
  error?: string | null;
  onRefresh: () => void;
  onClearAll: () => void;
  clearing?: boolean;
}

const RawDataPanel: React.FC<RawDataPanelProps> = ({
  data,
  loading,
  error,
  onRefresh,
  onClearAll,
  clearing,
}) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const formattedJson = useMemo(() => {
    if (data === undefined || data === null) {
      return t('lc.dashboard.rawDataEmpty');
    }
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data, t]);

  const handleCopy = async () => {
    if (Platform.OS !== 'web' || typeof navigator?.clipboard?.writeText !== 'function') {
      showAlert('info', t('lc.dashboard.copyUnavailable'));
      return;
    }
    await navigator.clipboard.writeText(formattedJson);
    showAlert('success', t('lc.dashboard.copySuccess'));
  };

  return (
    <Box
      bg="$white"
      borderRadius="$xl"
      borderWidth={1}
      borderColor="$borderColor"
      p="$4"
      width="100%"
    >
      <HStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3" mb="$3">
        <VStack flex={1} minWidth={200}>
          <Text fontSize="$lg" fontWeight="$semibold" color="$textForeground">
            {t('lc.dashboard.rawDataTitle')}
          </Text>
          <Text fontSize="$sm" color="$textMutedForeground" mt="$1">
            {t('lc.dashboard.rawDataDescription')}
          </Text>
        </VStack>
        <HStack gap="$2" flexWrap="wrap">
          <Button size="sm" variant="outline" onPress={onRefresh} isDisabled={loading || clearing}>
            <ButtonText>{loading ? t('common.loading') : t('lc.dashboard.refresh')}</ButtonText>
          </Button>
          <Button size="sm" variant="outline" onPress={handleCopy} isDisabled={!data}>
            <ButtonText>{t('lc.dashboard.copyJson')}</ButtonText>
          </Button>
          <Button
            size="sm"
            variant="solid"
            action="negative"
            onPress={onClearAll}
            isDisabled={loading || clearing}
          >
            <ButtonText>
              {clearing ? t('lc.dashboard.clearing') : t('lc.dashboard.clearAllRawData')}
            </ButtonText>
          </Button>
        </HStack>
      </HStack>

      {error ? (
        <Box bg="$error50" borderRadius="$md" p="$3" mb="$3">
          <Text fontSize="$sm" color="$error700">
            {error}
          </Text>
        </Box>
      ) : null}

      <ScrollView
        maxHeight={420}
        borderWidth={1}
        borderColor="$borderLight200"
        borderRadius="$md"
        bg="$backgroundLight50"
        p="$3"
      >
        <Text
          fontSize="$xs"
          fontFamily={Platform.OS === 'web' ? 'monospace' : undefined}
          color="$textForeground"
          selectable
        >
          {formattedJson}
        </Text>
      </ScrollView>
    </Box>
  );
};

export default RawDataPanel;
