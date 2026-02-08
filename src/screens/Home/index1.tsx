import React, { useState } from 'react';
import { VStack, HStack, ScrollView, Box } from '@ui';
import Container from '@ui/Container';

import { dashboardStyles } from './Styles';
import DashboardHeader from './components/DashboardHeader';
import TabNavigation from './components/TabNavigation';
import MetricCard from './components/MetricCard';
import TasksOverviewCard from './components/TasksOverviewCard';
import EnrollmentStatusCard from './components/EnrollmentStatusCard';
import TopPerformersCard from './components/TopPerformersCard';
import NeedsAttentionCard from './components/NeedsAttentionCard';

/**
 * DashboardScreen - Layout is automatically applied by navigation based on user role
 */
const DashboardScreen = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'outcomeIndicators'>('overview');
  const [selectedTime, setSelectedTime] = useState('All Time');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [selectedSite, setSelectedSite] = useState('All Sites');
  const [selectedGender, setSelectedGender] = useState('All Gender');

  return (
    <Container>
      <ScrollView {...dashboardStyles.scrollView}>
        <VStack {...dashboardStyles.mainVStack}>
          {/* Dashboard Header with Filters */}
          <DashboardHeader
            selectedTime={selectedTime}
            selectedProvince={selectedProvince}
            selectedSite={selectedSite}
            selectedGender={selectedGender}
            onTimeChange={setSelectedTime}
            onProvinceChange={setSelectedProvince}
            onSiteChange={setSelectedSite}
            onGenderChange={setSelectedGender}
          />

          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <VStack {...dashboardStyles.contentContainer}>
              {/* Metric Cards Row */}
              <HStack {...dashboardStyles.metricsRow}>
                <MetricCard
                  title="Total Caseload"
                  value={36}
                  icon="Users"
                  iconColor="$primary500"
                />
                <MetricCard
                  title="Active Participants"
                  value={17}
                  icon="Activity"
                  iconColor="$info100"
                />
                <MetricCard
                  title="Completed"
                  value={7}
                  icon="CircleCheck"
                  iconColor="$success600"
                />
                <MetricCard
                  title="Average Progress"
                  value="65%"
                  icon="Clock"
                  iconColor="$blue500"
                />
              </HStack>

              {/* Cards Grid */}
              <HStack {...dashboardStyles.cardsRow}>
                <Box {...dashboardStyles.cardColumn}>
                  <TasksOverviewCard />
                </Box>
                <Box {...dashboardStyles.cardColumn}>
                  <EnrollmentStatusCard />
                </Box>
              </HStack>

              <HStack {...dashboardStyles.cardsRow}>
                <Box {...dashboardStyles.cardColumn}>
                  <TopPerformersCard />
                </Box>
                <Box {...dashboardStyles.cardColumn}>
                  <NeedsAttentionCard />
                </Box>
              </HStack>
            </VStack>
          )}

          {/* Outcome Indicators Tab Content */}
          {activeTab === 'outcomeIndicators' && (
            <VStack {...dashboardStyles.contentContainer}>
              {/* Placeholder for Outcome Indicators content */}
              <Box {...dashboardStyles.placeholderBox}>
                {/* Outcome Indicators content will go here */}
              </Box>
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </Container>
  );
};

export default DashboardScreen;
