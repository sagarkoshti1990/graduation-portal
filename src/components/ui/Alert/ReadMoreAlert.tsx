import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Easing,
} from 'react-native';

import {
  Alert,
  AlertText,
  Pressable,
  Text,
  HStack,
  VStack,
} from '@gluestack-ui/themed';

import LucideIcon from '@ui/LucideIcon';

type VariantType =
  | 'success'
  | 'info'
  | 'error'
  | 'warning'
  | 'muted';

interface ReadMoreAlertProps {
  text: string;
  lineLimit?: number;
  variant?: VariantType;
  readMoreText?: string;
  readLessText?: string;
  collapsible?: boolean;
  label?:string
}

const LINE_HEIGHT = 22;

const variantConfig: Record<
  VariantType,
  {
    borderColor: string;
    backgroundColor: string;
    iconColor: string;
    Icon: string;
  }
> = {
  success: {
    borderColor: '$success300',
    backgroundColor: '$success50',
    iconColor: '#16A34A',
    Icon: 'CircleCheck',
  },

  info: {
    borderColor: '$info300',
    backgroundColor: '$info50',
    iconColor: '#2563EB',
    Icon: 'Info',
  },

  error: {
    borderColor: '$error300',
    backgroundColor: '$error50',
    iconColor: '#DC2626',
    Icon: 'XCircle',
  },

  warning: {
    borderColor: '$warning300',
    backgroundColor: '$warning50',
    iconColor: '#D97706',
    Icon: 'Info',
  },

  muted: {
    borderColor: '$background300',
    backgroundColor: '$background100',
    iconColor: '#6B7280',
    Icon: 'Info',
  },
};

const ReadMoreAlert = ({
  text,
  lineLimit = 3,
  variant = 'info',
  readMoreText = 'Show More',
  readLessText = 'Show Less',
  collapsible = true,
  label
}: ReadMoreAlertProps) => {
  const [expanded, setExpanded] =
    useState(false);
  const [contentHeight, setContentHeight] =
    useState(0);
  const config = variantConfig[variant];
  const collapsedHeight =
    lineLimit * LINE_HEIGHT;
    
  const animatedHeight = useRef(
    new Animated.Value(
      collapsedHeight,
    ),
  ).current;

  const shouldShowToggle =
    collapsible &&
    contentHeight >
    collapsedHeight;

  useEffect(() => {
    Animated.timing(
      animatedHeight,
      {
        toValue: expanded
          ? contentHeight
          : collapsedHeight,
        duration: 320,
        easing:
          Easing.out(
            Easing.ease,
          ),
        useNativeDriver: false,
      },
    ).start();
  }, [
    expanded,
    contentHeight,
    collapsedHeight,
  ]);

  return (
    <Alert
      borderWidth={1}
      borderRadius="$xl"
      p="$4"
      width="$full"
      borderColor={
        config.borderColor
      }
      bg={
        config.backgroundColor
      }
      flexDirection='column'
    >
      <HStack
        space="sm"
        alignItems="flex-start"
        width="$full"
      >
        <LucideIcon
          size={18}
          color={config.iconColor}
          name={config.Icon}
          style={{
            marginTop: 2,
          }}
        />

        <VStack
          flex={1}
          minWidth={0}
        >
          {/* Hidden text for measurement */}
          <Text
            size="sm"
            position="absolute"
            opacity={0}
            pointerEvents="none"
            zIndex={-1}
            left={0}
            right={0}
            width="$full"
            lineHeight={LINE_HEIGHT}
            flexWrap="wrap"
            onLayout={(e: any) => {
              setContentHeight(
                e.nativeEvent.layout
                  .height,
              );
            }}
          >
            {label && <Text fontWeight={"bold"}>{label}</Text>}
            {text}
          </Text>

          <Animated.View
            style={{
              height:
                animatedHeight,
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <AlertText
              flexShrink={1}
              size="sm"
              lineHeight={LINE_HEIGHT}
              flexWrap="wrap"
              width="$full"
            >
              {label && <Text fontWeight={"bold"}>{label}: </Text>}
              {text}
            </AlertText>
          </Animated.View>
        </VStack>
      </HStack>

      {shouldShowToggle && (
        <Pressable
          mt="$2"
          ml={26}
          alignSelf="flex-start"
          onPress={() =>
            setExpanded(
              (prev) => !prev,
            )
          }
        >
          <Text
            size="sm"
            fontWeight="$medium"
            textDecorationLine="underline"
          >
            {expanded
              ? readLessText
              : readMoreText}
          </Text>
        </Pressable>
      )}
    </Alert>
  );
};

export default ReadMoreAlert;