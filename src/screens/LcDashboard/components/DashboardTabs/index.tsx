import React from 'react';
import { HStack, Pressable, Text } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';

export type LcDashboardTabKey = 'overview' | 'outcomes' | 'graduationCriteria';

interface DashboardTab {
  key: LcDashboardTabKey;
  labelKey: string;
}

export const LC_DASHBOARD_TABS: DashboardTab[] = [
  { key: 'overview', labelKey: 'lc.dashboard.tabs.overview' },
  { key: 'outcomes', labelKey: 'lc.dashboard.tabs.outcomes' },
  { key: 'graduationCriteria', labelKey: 'lc.dashboard.tabs.graduationCriteria' },
];

interface DashboardTabsProps {
  activeTab: LcDashboardTabKey;
  onTabChange: (tab: LcDashboardTabKey) => void;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  return (
    <HStack
      bg="$backgroundLight100"
      borderRadius="$lg"
      p="$1"
      gap="$1"
      flexWrap="wrap"
      alignSelf="flex-start"
    >
      {LC_DASHBOARD_TABS.map(tab => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            px="$4"
            py="$2"
            borderRadius="$md"
            bg={isActive ? '$white' : 'transparent'}
            shadowColor={isActive ? '$shadowColor' : 'transparent'}
            shadowOpacity={isActive ? 0.1 : 0}
            shadowRadius={isActive ? 4 : 0}
          >
            <Text
              fontSize="$sm"
              fontWeight={isActive ? '$semibold' : '$normal'}
              color={isActive ? '$textForeground' : '$textMutedForeground'}
            >
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  );
};

export default DashboardTabs;
