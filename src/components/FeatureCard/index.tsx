import React, { memo, useState } from 'react';

import {
  Box,
  Text,
  VStack,
  Pressable,
  Tooltip,
  TooltipContent,
  TooltipText,
} from '@ui';
import { useNavigation } from '@react-navigation/native';
import { FeatureCardProps } from '@app-types/components';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useLanguage } from '@contexts/LanguageContext';
import { LucideIcon } from '@ui/index';
import { isWeb } from '@utils/platform';

const FeatureCard: React.FC<FeatureCardProps> = ({ card }) => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(!isWeb || false);
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

  const isCardDisabled = isDisabled || isComingSoon;

  const handlePress = () => {
    if (!navigationUrl || isCardDisabled) {
      return;
    }

    // @ts-ignore
    navigation.navigate(navigationUrl);
  };
  const renderCard = (triggerProps?: any) => (
    <Pressable
      {...triggerProps}
      role="group"
      flex={1}
      disabled={isCardDisabled}
      onPress={handlePress}
      sx={{
        '@web': {
          cursor: isCardDisabled ? 'not-allowed' : 'pointer',
        },
      }}
      {...(isWeb && {
        onHoverIn: () => setIsHovered(true),
        onHoverOut: () => setIsHovered(false)
      })}
    >
      <Box
        flex={1}
        minHeight={250}
        overflow="hidden"
        borderRadius="$lg"
        borderTopWidth={4}
        borderTopColor={color}
        bg="$backgroundLight0"
        opacity={isCardDisabled ? 0.5 : 1}
        elevation={3}
        shadowColor="$backgroundDark900"
        shadowOffset={{
          width: 0,
          height: 2,
        }}
        shadowOpacity={0.1}
        shadowRadius={8}
        $web-transition="all 0.3s ease-in-out"
        $web-transform={isHovered && !isComingSoon ? 'scale(1.05)' : 'scale(1)'}
        $web-cursor={isComingSoon ? 'not-allowed' : 'pointer'}
        $web-boxShadow={
          isHovered && !isComingSoon
            ? '0px 8px 24px rgba(0, 0, 0, 0.15)'
            : '0px 2px 8px rgba(0, 0, 0, 0.1)'
        }
      >
        <VStack
          flex={1}
          justifyContent="space-between"
          space="lg"
          p="$5"
        >
          <VStack space="md">
            <Box {...(isWeb ? {minHeight:58} : {})}>
              <Box
                w={48}
                h={48}
                $web-transition="width 0.3s ease-in-out, height 0.3s ease-in-out, transform 0.3s ease-in-out"
                $web-transform={
                  isHovered && !isComingSoon && isWeb
                    ? 'rotate(3deg)'
                    : 'none'
                }
                {...(isHovered && !isComingSoon && isWeb && {
                  w: 58,
                  h: 58,
                })}         
                borderRadius={16}
                bg={color}
                alignItems="center"
                justifyContent="center"
              >
                <LucideIcon
                  name={icon}
                  size={
                    isHovered && !isComingSoon && isWeb ? 29 : 24
                  }
                  style={{
                    transition: isWeb ? 'width 0.3s ease-in-out, height 0.3s ease-in-out' : undefined,
                  }}
                  color="white"
                />
              </Box>
            </Box>
            <Text
              {...TYPOGRAPHY.h4}
              color={"$foreground"}
            >
              {t(title)}
            </Text>
  
            <Text
              {...TYPOGRAPHY.paragraph}
              color={"$mutedForeground"}
              numberOfLines={2}
            >
              {t(description)}
            </Text>
          </VStack>
  
          {!!pressableActionText &&
            !isComingSoon && (
              <Box
                flexDirection="row"
                alignItems="center"
                opacity={isHovered ? 1 : 0}
                sx={{
                  '@web': {
                    transition: 'opacity 0.25s ease',
                  },
                }}
              >
                <Text
                  fontSize="$sm"
                  fontWeight="$semibold"
                  color={color}
                  lineHeight={20}
                  mr="$1"
                >
                  {t(pressableActionText)}
                </Text>

                <LucideIcon name="ChevronRight" size={16} color={color}/>
              </Box>
          )}
  
          {isComingSoon && (
            <Box
              position="absolute"
              top="$4"
              right="$4"
              px="$2"
              py="$1"
              borderRadius="$sm"
              bg="$warning500"
            >
              <Text
                fontSize="$xs"
                fontWeight="$semibold"
                color="$white"
              >
                {t('common.comingSoon')}
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Pressable>
  );

  if (isComingSoon) {
    return (
      <Tooltip
        placement="top"
        offset={8}
        trigger={(triggerProps: any) =>
          renderCard(triggerProps)
        }
      >
        <TooltipContent>
          <TooltipText>
            {t('common.comingSoon')}
          </TooltipText>
        </TooltipContent>
      </Tooltip>
    );
  }

  return renderCard();
};

export default memo(FeatureCard);