import React from 'react';
import { VStack } from '@ui';

import { adminDashboardStyles } from './Styles';
import TitleHeader from '@components/TitleHeader';
import FilterButton from '@components/Filter';
import DashboardCards from './DashboardCards';
import { AdminDashboardFilterOptions } from '@constants/ADMIN_DASHBOARD_FILTERS';
import { indicatorCards } from '@constants/ADMIN_DASHBOARD_CARDS';
import logger from '@utils/logger';

const AdminDashboard = () => {
  const handleFilterChange = (filters: Record<string, any>) => {
    logger.log('Dashboard filters changed:', filters);
    // Add your filter logic here
  };

  return (
    <VStack {...adminDashboardStyles.container}>
      {/* Title Header */}
      <TitleHeader title="admin.dashboard" description="admin.dashboardDescription" />

      {/* Filter Button */}
      <FilterButton 
        data={AdminDashboardFilterOptions as any[]} 
        onFilterChange={handleFilterChange}
      />

      {/* Dashboard Cards with Info Card */}
      <DashboardCards 
        cards={indicatorCards}
        infoHeadingKey="admin.selectIndicatorType"
        infoDescriptionKey="admin.indicatorTypeDescription"
      />
    </VStack>
  );
};

export default AdminDashboard;