import React from 'react';
import { HStack, Pressable, Text } from '@ui';
import { tabNavigationStyles } from './Styles';

interface TabNavigationProps {
  activeTab: 'overview' | 'outcomeIndicators';
  onTabChange: (tab: 'overview' | 'outcomeIndicators') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <HStack {...tabNavigationStyles.container}>
      <Pressable
        onPress={() => onTabChange('overview')}
        {...tabNavigationStyles.tab}
        {...(activeTab === 'overview'
          ? tabNavigationStyles.activeTab
          : tabNavigationStyles.inactiveTab)}
      >
        <Text
          {...tabNavigationStyles.tabText}
          {...(activeTab === 'overview'
            ? tabNavigationStyles.activeTabText
            : tabNavigationStyles.inactiveTabText)}
        >
          Overview
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onTabChange('outcomeIndicators')}
        {...tabNavigationStyles.tab}
        {...(activeTab === 'outcomeIndicators'
          ? tabNavigationStyles.activeTab
          : tabNavigationStyles.inactiveTab)}
      >
        <Text
          {...tabNavigationStyles.tabText}
          {...(activeTab === 'outcomeIndicators'
            ? tabNavigationStyles.activeTabText
            : tabNavigationStyles.inactiveTabText)}
        >
          Outcome Indicators
        </Text>
      </Pressable>
    </HStack>
  );
};

export default TabNavigation;

