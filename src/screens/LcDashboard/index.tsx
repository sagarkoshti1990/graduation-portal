import React, { useCallback, useEffect, useState } from 'react';
import { VStack, HStack, Text, Box, Container, ScrollView } from '@ui';

import { styles } from './Styles';
import { useLanguage } from '@contexts/LanguageContext';
import { useAuth } from '@contexts/AuthContext';
import logger from '@utils/logger';
import OverviewCards from './components/OverviewCards';
import TasksOverviewCard from './components/TasksOverviewCard';
import EnrollmentStatusCard from './components/EnrollmentStatusCard';
import PerformanceActivityReport from './components/PerformanceActivityReport';
import DashboardTabs, { type LcDashboardTabKey } from './components/DashboardTabs';
import OutcomesTab from './components/OutcomesTab';
import GraduationCriteriaTab from './components/GraduationCriteriaTab';
import { extractLcDashboardMetrics, type LcDashboardOverviewResponse } from './utils/reportingMetrics';
import { fetchLcDashboardOverview } from '../../services/bracReporting/bracReportingService';

const LcDashboardScreen = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [response, setResponse] = useState<LcDashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LcDashboardTabKey>('overview');

  const coachId = user?.id;

  const loadData = useCallback(async () => {
    if (!coachId) {
      setError(t('lc.dashboard.missingCoachId'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLcDashboardOverview(coachId);
      setResponse(result);
    } catch (err: any) {
      logger.error('Failed to fetch BRAC reporting data', err);
      setError(err?.message || t('lc.dashboard.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [coachId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = extractLcDashboardMetrics(response?.data);

  return (
      <Container>
        <ScrollView {...styles.scrollView}>
        <VStack {...styles.mainVStack}>
          <VStack>
            <Text {...styles.titleText}>{t('lc.dashboard.title')}</Text>
            <Text {...styles.welcomeText}>{t('lc.dashboard.subtitle')}</Text>
          </VStack>

          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'overview' && (
            <VStack space="lg">
              {loading && !response ? (
                <Text fontSize="$sm" color="$textMutedForeground">
                  {t('common.loading')}
                </Text>
              ) : null}

              {error ? (
                <Box bg="$error50" borderRadius="$md" p="$3">
                  <Text fontSize="$sm" color="$error700">
                    {error}
                  </Text>
                </Box>
              ) : null}

              <OverviewCards metrics={metrics} />

              <HStack flexWrap="wrap" gap="$4">
                <TasksOverviewCard
                  totalTasks={response?.data?.idpTasks?.totalTasks}
                  completedTasks={response?.data?.idpTasks?.completedTasks}
                />
                <EnrollmentStatusCard data={response?.data} />
              </HStack>

              <PerformanceActivityReport data={response?.data} />
            </VStack>
          )}

          {activeTab === 'outcomes' && <OutcomesTab />}

          {activeTab === 'graduationCriteria' && <GraduationCriteriaTab />}
        </VStack>
        </ScrollView>

       </Container>
  );
};

export default LcDashboardScreen;
