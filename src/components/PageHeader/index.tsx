import React from 'react';
import { VStack, HStack, Text, Button, ButtonText, ButtonIcon, Box } from '@ui';
import { LucideIcon } from '@ui';
import { Container } from '@ui';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { pageHeaderStyles } from './Styles';

/**
 * Props for PageHeader component
 */
export interface PageHeaderProps {
  /** Back button text */
  backButtonText?: string;
  /** Main title text */
  title?: string;
  /** Subtitle text displayed below the title */
  subtitle?: string;
  /** Callback function when back button is pressed */
  onBackPress?: () => void;
  /** Right section content */
  rightSection?: React.ReactNode;
  /** Children content */
  children?: React.ReactNode;
  /** Content styles */
  _content?: any;
  /** Container styles */
  _container?: any;
}

/**
 * PageHeader Component
 * Reusable header component with back button, title/subtitle, and optional action button
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  backButtonText,
  rightSection,
  children,
  _content,
  _container
}) => {
  return (
    <VStack {...pageHeaderStyles.container}>
      <Container {..._container}>
        <HStack {...pageHeaderStyles.content} {..._content}>
          <HStack {...pageHeaderStyles.leftSection}>
            {/* @ts-ignore: ghost variant is defined in theme */}
            {onBackPress &&
              <Button variant={"ghost" as any} onPress={onBackPress}>
                <ButtonIcon as={LucideIcon} name="ArrowLeft" size={16} />
              {backButtonText && <ButtonText {...TYPOGRAPHY.bodySmall}>{backButtonText}</ButtonText>}
              </Button>
            }
            <VStack {...pageHeaderStyles.textSection}>
              <Text {...TYPOGRAPHY.h4} fontWeight="$normal" lineHeight="$lg" color="$textForeground">
                {title}
              </Text>
              {subtitle && (
                <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                  {subtitle}
                </Text>
              )}
            </VStack>
          </HStack>
          {rightSection ? <Box {...pageHeaderStyles.rightSection}>{rightSection}</Box> : null}
        </HStack>
        {children}
      </Container>
    </VStack>
  );
};

export default PageHeader;

