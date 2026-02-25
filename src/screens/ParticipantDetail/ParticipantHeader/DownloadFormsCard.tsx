import React from 'react';
import { useWindowDimensions, Platform, Linking, Image } from 'react-native';
import { Box, HStack, Text, Button, ButtonText, LucideIcon } from '@ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { CONSENT_FORM_ASSET, SLA_FORM_ASSET } from './downloadAssets';
import { useLanguage } from '@contexts/LanguageContext';
import { useAlert } from '@components/ui/Alert';

type FormItem = {
  label: string;
  onPress?: () => void;
};

type Props = {
  consent?: FormItem;
  sla?: FormItem;
};

const DownloadFormsCard: React.FC<Props> = ({ consent, sla }) => {
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  // breakpoint similar to design systems
  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 768;

  const rowLayout = isWeb && isDesktop;

  const openDownload = (assetSource: number | string) => {
    const uri =
      typeof assetSource === 'string'
        ? assetSource
        : Image.resolveAssetSource(assetSource)?.uri;
    
    if (!uri) {
      console.error('Download failed: URI is undefined');
      showAlert('error', t('downloadForms.downloadUriError'));
      return;
    }
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // For web, we need to handle the URL properly
        // If the URI starts with /, it's a relative path on our server
        const downloadUrl = uri.startsWith('/') 
          ? uri 
          : uri;
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Extract filename from URI and decode it
        const pathParts = downloadUrl.split('/');
        const filename = pathParts[pathParts.length - 1] || 'download';
        link.download = decodeURIComponent(filename);
        
        // Set target to avoid navigation issues
        link.target = '_self';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download initiated successfully for:', filename);
        showAlert('success', t('downloadForms.downloadSuccess'));
      } catch (error) {
        console.error('Download error:', error);
        showAlert('error', t('downloadForms.downloadError'));
        // Fallback: open in new tab
        window.open(uri, '_blank');
      }
      return;
    }
    
    // Native platforms
    Linking.openURL(uri)
      .then(() => {
        showAlert('success', t('downloadForms.downloadSuccess'));
      })
      .catch(err => {
        console.error('Failed to open URL:', err);
        showAlert('error', t('downloadForms.downloadError'));
      });
  };

  return (
    <Box
      bg="$white"
      borderRadius="$xl"
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
          onPress={consent?.onPress || (() => openDownload(CONSENT_FORM_ASSET))}
          isStacked={!rowLayout}
        />

        <DownloadRow
          label={sla?.label || 'Download SLA Form'}
          onPress={sla?.onPress || (() => openDownload(SLA_FORM_ASSET))}
          isStacked={!rowLayout}
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
}: {
  label: string;
  onPress?: () => void;
  isStacked?: boolean;
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
