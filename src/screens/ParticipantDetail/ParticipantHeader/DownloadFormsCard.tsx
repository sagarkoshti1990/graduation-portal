import React from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { Box, HStack, Text, Button, ButtonText, LucideIcon } from '@ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useLanguage } from '@contexts/LanguageContext';
import { useAlert } from '@components/ui/Alert';
import { openDownload } from '@utils/helper';

const CONSENT_FORM_ASSET = process.env.CONSENT_FORM_SAMPLE_URL || ""
const SLA_FORM_ASSET = process.env.SLA_FORM_SAMPLE_URL || ""

type FormItem = {
  label: string;
  onPress?: () => void;
};

type Props = {
  consent?: FormItem;
  sla?: FormItem;
  mode?: 'edit' | 'read-only';
};

const DownloadFormsCard: React.FC<Props> = ({ consent, sla, mode }) => {
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  // breakpoint similar to design systems
  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 768;

  const rowLayout = isWeb && isDesktop;

  return (
    <Box
      bg="$white"
      borderRadius="$3xl"
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      marginBottom="$4"
    >
      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center">
        <HStack alignItems="center" space="sm">
          <LucideIcon name="FileText" size={20} color="#667085" />
          <Text {...TYPOGRAPHY.label} color="$textPrimary">
            {t('downloadForms.downloadForms')}
          </Text>
        </HStack>
      </HStack>

      <Text
        {...TYPOGRAPHY.paragraph}
        color="$textSecondary"
        marginTop="$1"
        marginBottom="$3"
      >
        {t('downloadForms.downloadNecessaryForms')}
      </Text>

      {/* Responsive Row */}
      <HStack space="md" flexDirection={rowLayout ? 'row' : 'column'}>
        <DownloadRow
          label={consent?.label || 'Download Consent Form'}
          onPress={consent?.onPress || (() => openDownload(CONSENT_FORM_ASSET,t,showAlert))}
          isStacked={!rowLayout}
          isDisabled={mode === 'read-only'}
        />

        <DownloadRow
          label={sla?.label || 'Download SLA Form'}
          onPress={sla?.onPress || (() => openDownload(SLA_FORM_ASSET,t,showAlert))}
          isStacked={!rowLayout}
          isDisabled={mode === 'read-only'}
        />
      </HStack>
    </Box>
  );
};

export default DownloadFormsCard;

/* ---------------- Row Component ---------------- */

const DownloadRow = ({
  label,
  onPress,
  isStacked = false,
  isDisabled = false,
}: {
  label: string;
  onPress?: () => void;
  isStacked?: boolean;
  isDisabled?: boolean;
}) => {
  const { t } = useLanguage();
  return (
    <Box
      flex={1}
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$xl"
      padding="$3"
      flexDirection={isStacked ? 'column' : 'row'}
      justifyContent="space-between"
      alignItems={isStacked ? 'stretch' : 'center'}
      bg="#F6F7FB"
    >
      <HStack alignItems="center" space="sm" flex={1}>
        <LucideIcon name="FileText" size={18} color="#7F56D9" />
        <Text {...TYPOGRAPHY.bodySmall} color="$textPrimary" numberOfLines={1}>
          {label}
        </Text>
      </HStack>

      <Button
        size="sm"
        bg="$primary500"
        borderRadius="$md"
        paddingHorizontal="$3"
        paddingVertical="$2"
        onPress={onPress}
        $hover-bg="$primary600"
        width={isStacked ? '$full' : 'auto'}
        marginTop={isStacked ? '$2' : '$0'}
        isDisabled={isDisabled}
      >
        <HStack alignItems="center" space="xs">
          <LucideIcon name="Download" size={16} color="#ffffff" />
          <ButtonText {...TYPOGRAPHY.button} color="$white">
            {t('downloadForms.Download')}
          </ButtonText>
        </HStack>
      </Button>
    </Box>
  );
};
