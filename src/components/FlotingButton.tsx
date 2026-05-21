import React, { useCallback, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipText,
  VStack,
  LucideIcon,
  Button,
  ButtonIcon,
  ButtonText,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';

// Define the interface for each action button
export interface FabActionItem {
  label: string;
  icon: any; // Accepts any Lucide icon component
  onPress: () => void;
  bgColor?: string; // Optional custom background color token
}

interface ExpandableFabProps {
  actions: FabActionItem[];
  buttonText?: string;
  onPress?: () => void;
}

export default function ExpandableFab({
  actions,
  buttonText,
  onPress,
}: ExpandableFabProps) {
    const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => setIsOpen(!isOpen),[isOpen]);

  const mainButton = useCallback((triggerProps: any) =>(
      <Button
        {...triggerProps}
        {...(buttonText
          ? { size: 'sm' }
          : {
              position: 'relative',
              bottom: 0,
              right: 0,
              zIndex: 999,
              rounded: '$full',
              w: '$16',
              h: '$16 !important',
            })}
        variant={isOpen ? 'outlineghost' : 'solid'}
        onPress={() => {
          if (buttonText) {
            onPress?.();
          } else {
            toggleMenu();
          }
        }}
      >
        <ButtonIcon
          size={buttonText ? 16 : 20}
          as={LucideIcon}
          name={isOpen ? 'X' : 'Plus'}
        />
        {buttonText && <ButtonText>{buttonText}</ButtonText>}
      </Button>
    ),
    [buttonText,isOpen,toggleMenu,onPress],
  );

  return (
    <VStack
      {...(!buttonText
        ? {
            position: 'absolute',
            bottom: '$6',
            right: '$6',
            space: 'md',
            alignItems: 'center',
          }
        : {})}
    >
      {/* Dynamically generated sub-buttons */}
      {isOpen && (
        <VStack space="sm" alignItems="center">
          {actions.map((action, index) => (
            <Tooltip
              key={index}
              placement="left"
              trigger={triggerProps => (
                <Button
                  {...triggerProps}
                  onPress={() => {
                    action.onPress();
                    setIsOpen(false); // Closes menu after clicking an action
                  }}
                  rounded="$full"
                  w="$16"
                  h="$16"
                >
                  {/* Render the dynamic icon passed via props */}
                  <ButtonIcon size={20} as={LucideIcon} name={action.icon} />
                </Button>
              )}
            >
              <TooltipContent
                backgroundColor="$textMutedForeground"
                rounded={'lg'}
              >
                <TooltipText>{t(action.label)}</TooltipText>
              </TooltipContent>
            </Tooltip>
          ))}
        </VStack>
      )}

      {/* Main Trigger FAB */}
      <Tooltip placement="left" trigger={mainButton}>
        <TooltipContent backgroundColor="$textMutedForeground" rounded={'lg'}>
          <TooltipText>{buttonText ? buttonText : isOpen ? 'Close' : 'Open'}</TooltipText>
        </TooltipContent>
      </Tooltip>
    </VStack>
  );
}
