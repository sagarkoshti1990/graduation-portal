import React from 'react';
import { Box, VStack, HStack, Text } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { formatCurrency, titleCase } from '../../utils/outcomesTypes';

interface IncomeSourcesBreakdownProps {
  sources: { key: string; numeric: number; percentOfTotal: number }[];
}

const IncomeSourcesBreakdown: React.FC<IncomeSourcesBreakdownProps> = ({ sources }) => {
  const { t } = useLanguage();

  return (
    <Box flex={1} minWidth={280} bg="$white" borderRadius="$xl" borderWidth={1} borderColor="$borderColor" p="$4">
      <Text fontSize="$md" fontWeight="$semibold" color="$textForeground" mb="$1">
        {t('lc.dashboard.outcomes.incomeSourcesBreakdown')}
      </Text>
      <Text fontSize="$xs" color="$textMutedForeground" mb="$3">
        {t('lc.dashboard.outcomes.incomeSourcesBreakdownSubtitle')}
      </Text>

      {sources.length === 0 ? (
        <Text fontSize="$sm" color="$textMutedForeground">
          {t('lc.dashboard.outcomes.noData')}
        </Text>
      ) : (
        <VStack space="sm">
          {sources.map(source => (
            <VStack key={source.key} space="xs">
              <HStack justifyContent="space-between">
                <Text fontSize="$xs" color="$textForeground">
                  {titleCase(source.key)}
                </Text>
                <Text fontSize="$xs" color="$textMutedForeground">
                  {`${formatCurrency(source.numeric)} (${Math.round(source.percentOfTotal)}%)`}
                </Text>
              </HStack>
              <Box w="100%" h={6} bg="$backgroundLight100" borderRadius="$full" overflow="hidden">
                <Box
                  h="100%"
                  borderRadius="$full"
                  bg="$blue500"
                  width={`${Math.min(100, Math.max(0, source.percentOfTotal))}%`}
                />
              </Box>
            </VStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default IncomeSourcesBreakdown;
