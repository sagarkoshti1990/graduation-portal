import React from 'react';
import {
  Modal as GluestackModal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  HStack,
  VStack,
  Text,
  Heading,
  Box,
  CloseIcon,
  Icon as GluestackIcon,
  Button,
  ButtonText,
  ScrollView,
} from '@gluestack-ui/themed';
import { Pressable } from 'react-native';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { theme } from '@config/theme';
import { useLanguage } from '@contexts/LanguageContext';
import { ModalProps } from '@app-types/components';
import { commonModalContentStyles, commonModalContainerStyles, profileStyles } from './Styles';
import { usePlatform } from '@utils/platform';

/**
 * Modal Component
 * 
 * A flexible modal component using Gluestack UI Modal with:
 * - Header: Supports title, description, and icon section
 * - Body: Flexible content via children prop
 * - Footer: Optional - only displays if footerContent is provided
 * 
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   headerTitle="Modal Title"
 *   headerDescription="Optional description text"
 *   headerIcon={<LucideIcon name="Info" />}
 *   footerContent={
 *     <HStack space="md">
 *       <Button onPress={onCancel}>Cancel</Button>
 *       <Button onPress={onConfirm}>Confirm</Button>
 *     </HStack>
 *   }
 * >
 *   <Text>Modal body content</Text>
 * </Modal>
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'md',
  // Header props
  headerContent,
  headerTitle,
  headerDescription,
  headerIcon,
  showCloseButton = true,
  headerAlignment = 'center',
  headerProps,
  // Body props
  children,
  // Footer props
  footerContent,
  cancelButtonText,
  confirmButtonText,
  onCancel,
  onConfirm,
  confirmButtonColor = theme.tokens.colors.primary500,
  confirmButtonVariant = 'solid',
  // Additional styling
  maxWidth,
  contentProps,
  bodyProps,
  closeOnOverlayClick = true,
  
  ...modalProps // Spread all other Gluestack Modal props
  
}) => {
  const { t } = useLanguage();

  const { isMobile } = usePlatform();
  // Determine if footer should be shown
  const hasFooter = footerContent || cancelButtonText || confirmButtonText;
  
  // Handle cancel - use onCancel if provided, otherwise use onClose
  const handleCancel = onCancel || onClose;

  return (
    <GluestackModal 
      isOpen={isOpen} 
      onClose={onClose}
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      {...commonModalContainerStyles}
      {...modalProps} // Pass through all Gluestack Modal props
    >
      <ModalBackdrop />
      <ModalContent
        {...commonModalContentStyles}
        {...(maxWidth && { maxWidth: `${maxWidth}px` })}
        {...contentProps} maxHeight="90%"
      >
        {/* Header with Title, Description, and Icon */}
        {(headerContent || headerTitle || headerDescription || headerIcon || showCloseButton) && (
          <ModalHeader borderBottomWidth={0} padding="$6" paddingBottom="$4" {...headerProps}>
            <HStack space="md" alignItems={headerAlignment} flex={1}>
              {headerContent ? (
                headerContent
              ) : (
                <>
                  {/* Header Icon Section */}
                  {headerIcon && (
                    <Box {...profileStyles.headerIconContainer}>
                      {headerIcon}
                    </Box>
                  )}

                  {/* Title and Description */}
                  {(headerTitle || headerDescription) && (
                    <VStack flex={1} space="xs">
                      {headerTitle && (
                        <Heading
                          {...TYPOGRAPHY.h3}
                          color={theme.tokens.colors.textPrimary}
                        >
                          {typeof headerTitle === 'string'
                            ? t(headerTitle)
                            : headerTitle}
                        </Heading>
                      )}
                      {headerDescription && (
                        <Text
                          {...TYPOGRAPHY.paragraph}
                          color={theme.tokens.colors.textSecondary}
                          fontSize="$sm"
                        >
                          {typeof headerDescription === 'string'
                            ? t(headerDescription)
                            : headerDescription}
                        </Text>
                      )}
                    </VStack>
                  )}
                </>
              )}

              {/* Close Button */}
              {showCloseButton && (
                <Pressable onPress={onClose} accessibilityLabel={t('common.close')} accessibilityRole="button">
                  <Box
                    padding="$2"
                    borderRadius="$sm"
                    $web-cursor="pointer"
                    sx={{
                      ':hover': {
                        bg: '$backgroundLight100',
                      },
                    }}
                  >
                    <GluestackIcon as={CloseIcon} size="xl" color="$textLight600" />
                  </Box>
                </Pressable>
              )}
            </HStack>
          </ModalHeader>
        )}

        {/* Flexible Body Content */}
        <ModalBody padding="$6" paddingTop={headerContent || headerTitle || headerDescription || headerIcon ? "$2" : "$6"} paddingBottom={hasFooter ? "$4" : "$6"} {...bodyProps}>
          <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1 }}>{children}</ScrollView>
        </ModalBody>

        {/* Optional Footer - Shows if footerContent or button texts are provided */}
        {hasFooter && (
          <ModalFooter borderTopWidth={0} padding="$6" paddingTop="$4">
            {footerContent ? (
              footerContent
            ) : (
              <HStack space="md" width="$full" justifyContent="flex-end" flexDirection={isMobile ? 'column' : 'row'}>
                {/* Cancel Button */}
                {cancelButtonText && (
                  <Button
                    {...profileStyles.cancelButton}
                    onPress={handleCancel}
                  >
                    <ButtonText color={theme.tokens.colors.textPrimary} {...TYPOGRAPHY.button}>
                      {typeof cancelButtonText === 'string' ? t(cancelButtonText) : cancelButtonText}
                    </ButtonText>
                  </Button>
                )}
                {/* Confirm Button */}
                {confirmButtonText && onConfirm && (
                  <Button
                    {...profileStyles.confirmButton}
                    variant={confirmButtonVariant}
                    bg={confirmButtonColor}
                    onPress={onConfirm}
                    $hover-bg={confirmButtonColor}
                  >
                    <ButtonText color={theme.tokens.colors.modalBackground} {...TYPOGRAPHY.button}>
                      {typeof confirmButtonText === 'string' ? t(confirmButtonText) : confirmButtonText}
                    </ButtonText>
                  </Button>
                )}
              </HStack>
            )}
          </ModalFooter>
        )}
      </ModalContent>
    </GluestackModal>
  );
};

// Export ModalComponent as Modal
export default Modal;

