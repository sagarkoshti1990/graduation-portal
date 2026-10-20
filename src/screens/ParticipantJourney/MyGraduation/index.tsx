import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Heading, Pressable } from '@gluestack-ui/themed';
import { Container, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { theme } from '@config/theme';
import { myGraduationStyles } from './Styles';
import { isWeb } from '@utils/platform';

type IndicatorStatus = 'achieved' | 'onTrack' | 'atRisk';

interface IndicatorItem {
  id: string;
  title: string;
  status: IndicatorStatus;
  toAchieve: string;
  readinessAchieved?: string;
  readinessOnTrack?: string;
  readinessAtRisk?: string;
}

interface PillarData {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  indicators: IndicatorItem[];
}

const PILLARS_DATA: PillarData[] = [
  {
    id: 'livelihoods',
    title: 'Livelihoods',
    subtitle: '1 achieved · 2 on track · 1 at risk',
    icon: 'Briefcase',
    iconBg: 'rgba(139, 40, 66, 0.1)',
    iconColor: theme.tokens.colors.primary500,
    indicators: [
      {
        id: 'active-income',
        title: 'Active Income Generating Activity',
        status: 'achieved',
        toAchieve: 'The participant is engaged in employment or running a business for at least 12 consecutive months by the programme endline.',
      },
      {
        id: 'business-profitability',
        title: 'Business Profitability',
        status: 'onTrack',
        toAchieve: 'The business is profitable in at least 8 of the final 12 months before the programme endline, including the last two survey periods.',
        readinessAchieved: 'In the last 12 program months (at least 6 checks), the business is profitable in at least 2/3 of checks, and the last 2 checks are positive.',
        readinessOnTrack: 'Months 1-12: latest response is profitable. Months 13-24: profitable in at least 2/3 of checks during this period.',
        readinessAtRisk: 'Months 1-12: latest response is unprofitable. Months 13-24: profitable in less than 2/3 of checks during this period.',
      },
      {
        id: 'participant-income',
        title: 'Participant Income',
        status: 'atRisk',
        toAchieve: "The participant's monthly income is R5,001 or higher in at least 8 of the final 12 months before the programme endline, including the last two survey periods.",
      },
    ],
  },
  {
    id: 'financial-inclusion',
    title: 'Financial Inclusion',
    subtitle: '3 achieved · 1 on track · 0 at risk',
    icon: 'Landmark',
    iconBg: 'rgba(139, 40, 66, 0.1)',
    iconColor: theme.tokens.colors.primary500,
    indicators: [
      {
        id: 'savings-amount',
        title: 'Savings Amount',
        status: 'onTrack',
        toAchieve: "The participant has total savings of at least R4,606 (equivalent to one month's National Minimum Wage) by the programme endline.",
      },
      {
        id: 'savings-frequency',
        title: 'Savings Frequency',
        status: 'achieved',
        toAchieve: 'The participant saves at least once per month in the final 12 months before the programme endline.',
      },
      {
        id: 'record-keeping',
        title: 'Financial Record Keeping',
        status: 'achieved',
        toAchieve: 'The participant maintains written or digital financial records for both their household and business at the programme endline.',
        readinessAchieved: 'Reports maintaining written or digital financial records for household and business in both midline and endline assessments.',
        readinessOnTrack: 'By midline, reports maintaining written or digital financial records for at least household or business.',
        readinessAtRisk: 'By midline, reports not maintaining written or digital financial records for both household and business.',
      },
      {
        id: 'responsible-credit',
        title: 'Responsible Credit Usage',
        status: 'achieved',
        toAchieve: 'The participant manages formal or informal credit responsibly without unmanageable debt.',
      },
    ],
  },
  {
    id: 'social-protection',
    title: 'Social Protection',
    subtitle: '1 achieved · 1 on track',
    icon: 'Shield',
    iconBg: '$orange50',
    iconColor: theme.tokens.colors.warning500,
    indicators: [
      {
        id: 'food-security',
        title: 'Food Security & Nutrition',
        status: 'achieved',
        toAchieve: 'Zero household members skipping meals due to resource scarcity in the last 30 days.',
        readinessAchieved: 'Achieved: 3 stable meals per day across all household members.',
        readinessOnTrack: 'On Track: Occasional food strain but no missed meals.',
        readinessAtRisk: 'At Risk: Household members experiencing food shortages.',
      },
      {
        id: 'social-grants',
        title: 'Social Grant Access & Linkages',
        status: 'onTrack',
        toAchieve: 'All eligible household members linked to government social safety nets and grants.',
        readinessAchieved: 'Achieved: Registered and receiving eligible entitlements.',
        readinessOnTrack: 'On Track: Applications submitted and pending verification.',
        readinessAtRisk: 'At Risk: Eligible but unlinked to safety nets.',
      },
    ],
  },
  {
    id: 'social-empowerment',
    title: 'Social Empowerment',
    subtitle: '1 achieved · 1 on track · 1 at risk',
    icon: 'Users',
    iconBg: '$purple50',
    iconColor: theme.tokens.colors.purple600,
    indicators: [
      {
        id: 'coaching-sessions',
        title: 'Life Skills & Coaching Engagement',
        status: 'achieved',
        toAchieve: 'Active participation in 1-on-1 coaching sessions and life skills workshops.',
        readinessAchieved: 'Achieved: 90%+ attendance and goal progression.',
        readinessOnTrack: 'On Track: Regular attendance with scheduled follow-ups.',
        readinessAtRisk: 'At Risk: Repeatedly missed coaching sessions.',
      },
      {
        id: 'community-participation',
        title: 'Community & Peer Support Circles',
        status: 'onTrack',
        toAchieve: 'Regular participation in community groups and peer support networks.',
        readinessAchieved: 'Achieved: Active leader/participant in community activities.',
        readinessOnTrack: 'On Track: Attends monthly peer meetings.',
        readinessAtRisk: 'At Risk: Social isolation or lack of peer support.',
      },
      {
        id: 'self-efficacy',
        title: 'Self-Efficacy & Future Planning',
        status: 'atRisk',
        toAchieve: 'Articulates realistic long-term household goals and crisis contingency plans.',
        readinessAchieved: 'Achieved: Clear future milestone action plan developed.',
        readinessOnTrack: 'On Track: Working with coach on goal formulation.',
        readinessAtRisk: 'At Risk: Absence of crisis plan or future goal orientation.',
      },
    ],
  },
];

const MyGraduationScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    livelihoods: true,
    'financial-inclusion': false,
    'social-protection': false,
    'social-empowerment': false,
  });
  const [expandedLogic, setExpandedLogic] = useState<Record<string, boolean>>({
    'business-profitability': true,
    'record-keeping': true,
  });

  const handleBackToHome = () => {
    // @ts-ignore
    navigation.navigate('participant-portal');
  };

  const togglePillar = (pillarId: string) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId],
    }));
  };

  const toggleLogic = (indicatorId: string) => {
    setExpandedLogic(prev => ({
      ...prev,
      [indicatorId]: !prev[indicatorId],
    }));
  };

  const renderStatusBadge = (status: IndicatorStatus) => {
    switch (status) {
      case 'achieved':
        return (
          <Box {...myGraduationStyles.statusBadgeAchieved}>
            <Text {...myGraduationStyles.statusBadgeTextAchieved}>
              {t('participantJourney.graduation.achieved', 'Achieved')}
            </Text>
          </Box>
        );
      case 'onTrack':
        return (
          <Box {...myGraduationStyles.statusBadgeOnTrack}>
            <Text {...myGraduationStyles.statusBadgeTextOnTrack}>
              {t('participantJourney.graduation.onTrack', 'On Track')}
            </Text>
          </Box>
        );
      case 'atRisk':
      default:
        return (
          <Box {...myGraduationStyles.statusBadgeAtRisk}>
            <Text {...myGraduationStyles.statusBadgeTextAtRisk}>
              {t('participantJourney.graduation.atRisk', 'At Risk')}
            </Text>
          </Box>
        );
    }
  };

  const renderIndicatorIcon = (status: IndicatorStatus) => {
    switch (status) {
      case 'achieved':
        return (
          <LucideIcon
            name="CheckCircle2"
            size={18}
            color={theme.tokens.colors.success600}
            strokeWidth={2}
          />
        );
      case 'onTrack':
        return (
          <LucideIcon
            name="AlertCircle"
            size={18}
            color="#ca8a04"
            strokeWidth={2}
          />
        );
      case 'atRisk':
      default:
        return (
          <LucideIcon
            name="XCircle"
            size={18}
            color={theme.tokens.colors.error600}
            strokeWidth={2}
          />
        );
    }
  };

  return (
    <Box {...myGraduationStyles.page}>
      <Box {...myGraduationStyles.topHeaderBar}>
        <Container {...myGraduationStyles.headerContainer}>
          <HStack {...myGraduationStyles.headerTitleRow}>
            <Pressable
              {...myGraduationStyles.backPressable}
              {...(isWeb && {
                onHoverIn: () => setIsBackHovered(true),
                onHoverOut: () => setIsBackHovered(false),
              })}
              onPress={handleBackToHome}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Box
                {...myGraduationStyles.backIconBox}
                {...(isBackHovered ? myGraduationStyles.backIconBoxHover : {})}
              >
                <LucideIcon
                  name="ArrowLeft"
                  size={18}
                  color={isBackHovered ? theme.tokens.colors.primary500 : '$textDark900'}
                  strokeWidth={1.5}
                />
              </Box>
            </Pressable>
            <Heading {...myGraduationStyles.title}>
              {t('participantJourney.cards.graduation', 'My Graduation')}
            </Heading>
          </HStack>
        </Container>
      </Box>

      <Box {...myGraduationStyles.contentArea}>
        <Container {...myGraduationStyles.container}>
          <VStack {...myGraduationStyles.content}>
            {/* Graduation Criteria Summary Card */}
            <Box {...myGraduationStyles.criteriaCard}>
              <VStack {...myGraduationStyles.criteriaHeader}>
                <Text {...myGraduationStyles.criteriaTitle}>
                  {t('participantJourney.graduation.criteriaTitle', 'Graduation Criteria')}
                </Text>
                <Text {...myGraduationStyles.criteriaSubtitle}>
                  {t(
                    'participantJourney.graduation.criteriaSubtitle',
                    "12 indicators across 4 pillars · Track participant's progress toward graduation",
                  )}
                </Text>
              </VStack>

              <HStack {...myGraduationStyles.metricsRow}>
                {/* 5 Achieved */}
                <Box {...myGraduationStyles.metricBoxAchieved}>
                  <Text {...myGraduationStyles.metricValueAchieved}>5</Text>
                  <Text {...myGraduationStyles.metricLabelAchieved}>
                    {t('participantJourney.graduation.achieved', 'Achieved')}
                  </Text>
                </Box>

                {/* 5 On Track */}
                <Box {...myGraduationStyles.metricBoxOnTrack}>
                  <Text {...myGraduationStyles.metricValueOnTrack}>5</Text>
                  <Text {...myGraduationStyles.metricLabelOnTrack}>
                    {t('participantJourney.graduation.onTrack', 'On Track')}
                  </Text>
                </Box>

                {/* 2 At Risk */}
                <Box {...myGraduationStyles.metricBoxAtRisk}>
                  <Text {...myGraduationStyles.metricValueAtRisk}>2</Text>
                  <Text {...myGraduationStyles.metricLabelAtRisk}>
                    {t('participantJourney.graduation.atRisk', 'At Risk')}
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* Pillars Accordion Cards */}
            <VStack {...myGraduationStyles.pillarsContainer}>
              {PILLARS_DATA.map(pillar => {
                const isExpanded = expandedPillars[pillar.id];

                return (
                  <Box key={pillar.id} {...myGraduationStyles.pillarCard}>
                    <Pressable onPress={() => togglePillar(pillar.id)}>
                      <HStack {...myGraduationStyles.pillarHeader}>
                        <HStack {...myGraduationStyles.pillarLeft}>
                          <Box {...myGraduationStyles.pillarIconBox} bg={pillar.iconBg}>
                            <LucideIcon
                              name={pillar.icon}
                              size={20}
                              color={pillar.iconColor}
                              strokeWidth={1.8}
                            />
                          </Box>
                          <VStack {...myGraduationStyles.pillarTitleContainer}>
                            <Text {...myGraduationStyles.pillarTitle}>{pillar.title}</Text>
                            <Text {...myGraduationStyles.pillarSubtitle}>
                              {pillar.subtitle}
                            </Text>
                          </VStack>
                        </HStack>
                        <Box {...myGraduationStyles.pillarRight}>
                          <LucideIcon
                            name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                            size={18}
                            color={theme.tokens.colors.textMutedForeground}
                          />
                        </Box>
                      </HStack>
                    </Pressable>

                    {isExpanded && (
                      <VStack {...myGraduationStyles.pillarBody}>
                        {pillar.indicators.map(indicator => (
                          <Box key={indicator.id} {...myGraduationStyles.indicatorCard}>
                            <HStack {...myGraduationStyles.indicatorHeader}>
                              <HStack {...myGraduationStyles.indicatorTitleRow}>
                                {renderIndicatorIcon(indicator.status)}
                                <Text {...myGraduationStyles.indicatorTitle}>
                                  {indicator.title}
                                </Text>
                              </HStack>
                              {renderStatusBadge(indicator.status)}
                            </HStack>

                            <VStack {...myGraduationStyles.indicatorSection}>
                              <Text {...myGraduationStyles.indicatorSectionTitle}>
                                {t('participantJourney.graduation.toAchieve', 'To Achieve:')}
                              </Text>
                              <Text {...myGraduationStyles.indicatorDescription}>
                                {indicator.toAchieve}
                              </Text>
                            </VStack>

                            {(indicator.readinessAchieved ||
                              indicator.readinessOnTrack ||
                              indicator.readinessAtRisk) && (
                              <>
                                <Pressable onPress={() => toggleLogic(indicator.id)}>
                                  <HStack {...myGraduationStyles.logicToggleContainer}>
                                    <Text {...myGraduationStyles.logicToggleText}>
                                      {expandedLogic[indicator.id]
                                        ? '▼ Graduation Logic'
                                        : '► Graduation Logic'}
                                    </Text>
                                  </HStack>
                                </Pressable>

                                {expandedLogic[indicator.id] && (
                                  <VStack space="xs" mt="$1">
                                    <VStack {...myGraduationStyles.readinessList}>
                                      {indicator.readinessAchieved && (
                                        <HStack {...myGraduationStyles.readinessRow}>
                                          <Box {...myGraduationStyles.readinessDotGreen} />
                                          <Text {...myGraduationStyles.readinessText}>
                                            <Text fontWeight="$bold" color="$textDark900" fontSize="$xs">Achieved: </Text>
                                            {indicator.readinessAchieved.replace(/^Achieved:\s*/, '')}
                                          </Text>
                                        </HStack>
                                      )}
                                      {indicator.readinessOnTrack && (
                                        <HStack {...myGraduationStyles.readinessRow}>
                                          <Box {...myGraduationStyles.readinessDotYellow} />
                                          <Text {...myGraduationStyles.readinessText}>
                                            <Text fontWeight="$bold" color="$textDark900" fontSize="$xs">On Track: </Text>
                                            {indicator.readinessOnTrack.replace(/^On Track:\s*/, '')}
                                          </Text>
                                        </HStack>
                                      )}
                                      {indicator.readinessAtRisk && (
                                        <HStack {...myGraduationStyles.readinessRow}>
                                          <Box {...myGraduationStyles.readinessDotRed} />
                                          <Text {...myGraduationStyles.readinessText}>
                                            <Text fontWeight="$bold" color="$textDark900" fontSize="$xs">At Risk: </Text>
                                            {indicator.readinessAtRisk.replace(/^At Risk:\s*/, '')}
                                          </Text>
                                        </HStack>
                                      )}
                                    </VStack>

                                    {indicator.id === 'business-profitability' && (
                                      <Box {...myGraduationStyles.pathwayBadge}>
                                        <Text {...myGraduationStyles.pathwayBadgeText}>
                                          entrepreneurship pathway only
                                        </Text>
                                      </Box>
                                    )}
                                  </VStack>
                                )}
                              </>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default MyGraduationScreen;
