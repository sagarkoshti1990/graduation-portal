import React from 'react';
import { Box, VStack, HStack, Text } from '@ui';
import { LucideIcon } from '@ui';
import { metricCardStyles } from './Styles';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: string;
  iconColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  iconColor = '$primary500',
}) => {
  return (
    <Box {...metricCardStyles.container}>
      <HStack {...metricCardStyles.content}>
        {icon && (
          <Box {...metricCardStyles.iconContainer} bg={`${iconColor}20`}>
            <LucideIcon name={icon} size={24} color={iconColor} />
          </Box>
        )}
        <VStack {...metricCardStyles.textContainer}>
          <Text {...TYPOGRAPHY.bodySmall} color="$textSecondary">
            {title}
          </Text>
          <Text {...metricCardStyles.valueText}>{value}</Text>
        </VStack>
      </HStack>
    </Box>
  );
};

export default MetricCard;

