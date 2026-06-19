import React from 'react';
import { Box, HStack, Text } from '@ui';
import LucideIcon from '@components/ui/LucideIcon';

export enum DeploymentState {
  DEPLOYMENT_IN_PROGRESS = 'DEPLOYMENT_IN_PROGRESS',
  UPDATING = 'UPDATING',
  MAINTENANCE = 'MAINTENANCE',
}

const DEPLOYMENT_CONFIG = {
  [DeploymentState.DEPLOYMENT_IN_PROGRESS]: {
    message:
      'Deployment in progress. Some features may be temporarily unavailable.',
    icon: "LoaderCircle",
    bg: '$warning100',
    color: '$warning700',
  },

  [DeploymentState.UPDATING]: {
    message:
      'A new update is being rolled out. You may experience brief disruptions.',
    icon: "RefreshCw",
    bg: '$info100',
    color: '$info700',
  },

  [DeploymentState.MAINTENANCE]: {
    message:
      'The system is under maintenance. Temporary interruptions are expected.',
    icon: "Wrench",
    bg: '$error100',
    color: '$error700',
  },
} as const;

export default function DeploymentBanner() {
  const deploymentState = process.env.APP_DEPLOYMENT_STATE as DeploymentState;

  if (!deploymentState || !(deploymentState in DEPLOYMENT_CONFIG)) {
    return null;
  }

  const { message, icon: Icon, bg, color } = DEPLOYMENT_CONFIG[deploymentState];

  return (
    <Box
      bg={bg}
      px="$4"
      py="$2"
      borderBottomColor={color}
      borderBottomWidth="$1"
    >
      <HStack space="sm" alignItems="center" justifyContent="center">
        <LucideIcon name={Icon} size={16} color={color} />
        <Text color={color} fontSize="$sm" fontWeight="$medium">
          {message}
        </Text>
      </HStack>
    </Box>
  );
}