import React, { useMemo, useState } from 'react';
import { HStack, Box, Card, VStack, Text, Pressable, Badge, BadgeText, Heading, Select } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { dashboardCardsStyles } from './DashboardStyle';
import { DashboardCard, cardViewDataMap, individualIndicatorTopicCards } from '@constants/ADMIN_DASHBOARD_CARDS';
import Breadcrumb, { BreadcrumbItem } from '@components/Breadcrumb';
import CardView from './CardView';

interface DashboardCardsProps {
  cards: DashboardCard[];
  userId?: string;
  infoHeadingKey?: string; // Translation key for info card heading
  infoDescriptionKey?: string; // Translation key for info card description
}

/**
 * DashboardCards Component
 * Displays a horizontal stack of indicator cards for the admin dashboard
 * Optionally displays an info card above the cards
 */
const DashboardCards: React.FC<DashboardCardsProps> = ({ 
  cards, 
  userId = '',
  infoHeadingKey,
  infoDescriptionKey,
}) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [currentCards, setCurrentCards] = useState<DashboardCard[]>(cards);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
  const [selectedCardView, setSelectedCardView] = useState<string | null>(null);
  const [individualPathway, setIndividualPathway] = useState<string>('');
  const [individualParticipant, setIndividualParticipant] = useState<string>('');

  // Get card view data from constants
  const cardViewData = useMemo(() => {
    if (selectedCardView) {
      return cardViewDataMap[selectedCardView] || null;
    }
    return null;
  }, [selectedCardView]);

  const isIndividualIndicatorsScreen = useMemo(() => {
    const last = breadcrumbItems[breadcrumbItems.length - 1];
    return last?.id === 'individual-indicators' && !selectedCardView;
  }, [breadcrumbItems, selectedCardView]);

  const pathwayOptions = useMemo(
    () => [
      { value: 'employment', name: 'Employment' },
      { value: 'entrepreneurship', name: 'Entrepreneurship' },
    ],
    [],
  );

  const participantOptions = useMemo(() => {
    if (!individualPathway) return [];
    // Static sample data (matches screenshot style)
    return [
      { value: 'P001', name: 'Thabo Mokoena (P001)' },
      { value: 'P002', name: 'Nomvula Dlamini (P002)' },
      { value: 'P003', name: 'Sipho Ndlovu (P003)' },
    ];
  }, [individualPathway]);

  const enterIndividualIndicators = (outcomeIndicatorsCard?: DashboardCard | null, individualCard?: DashboardCard | null) => {
    setSelectedCardView(null);
    setCurrentCards([]);
    setIndividualPathway('');
    setIndividualParticipant('');
    setBreadcrumbItems([
      {
        id: 'back-to-indicators',
        label: 'Back to Indicator Types',
        labelKey: 'admin.backToIndicatorTypes',
        data: null,
      },
      {
        id: 'outcome-indicators',
        label: 'Outcome Indicators',
        labelKey: 'admin.outcomeIndicators.title',
        data: outcomeIndicatorsCard || null,
      },
      {
        id: 'individual-indicators',
        label: individualCard?.title || 'Individual Indicators',
        labelKey: individualCard?.title || 'admin.outcomeIndicators.types.individual.title',
        data: individualCard || null,
      },
    ]);
  };

  // Handle card press - check for sub-cards first
  const handleCardPress = (card: DashboardCard) => {
    // Special flow: Individual Indicators uses a filter screen before showing topic cards
    if (card.id === 'individual-indicators') {
      const outcomeIndicatorsCard = cards.find(c => c.id === 'outcome-indicators') || null;
      enterIndividualIndicators(outcomeIndicatorsCard, card);
      return;
    }

    // If card has sub-cards, show them and update breadcrumb
    if (card.subCards && card.subCards.length > 0) {
      setCurrentCards(card.subCards);
      setSelectedCardView(null); // Clear card view when showing sub-cards
      // Build breadcrumb - preserve existing breadcrumb if we're navigating deeper
      const newBreadcrumbItems: BreadcrumbItem[] = [];
      
      // If we're clicking cumulative-indicators, we need to include outcome-indicators in breadcrumb
      if (card.id === 'cumulative-indicators' || card.id === 'individual-indicators') {
        // Check if outcome-indicators is already in breadcrumb
        const outcomeIndicatorsIndex = breadcrumbItems.findIndex(item => item.id === 'outcome-indicators');
        if (outcomeIndicatorsIndex >= 0) {
          // Preserve breadcrumb up to outcome-indicators
          newBreadcrumbItems.push(...breadcrumbItems.slice(0, outcomeIndicatorsIndex + 1));
        } else {
          // Add back-to-indicators and outcome-indicators
          newBreadcrumbItems.push({
            id: 'back-to-indicators',
            label: 'Back to Indicator Types',
            labelKey: 'admin.backToIndicatorTypes',
            data: null,
          });
          newBreadcrumbItems.push({
            id: 'outcome-indicators',
            label: 'Outcome Indicators',
            labelKey: 'admin.outcomeIndicators.title',
            data: null,
          });
        }
      } else {
        // For other cards, start fresh or preserve existing
        if (breadcrumbItems.length > 0) {
          newBreadcrumbItems.push(...breadcrumbItems);
        } else {
          newBreadcrumbItems.push({
            id: 'back-to-indicators',
            label: 'Back to Indicator Types',
            labelKey: 'admin.backToIndicatorTypes',
            data: null,
          });
        }
      }
      
      // Add the current card to breadcrumb
      newBreadcrumbItems.push({
        id: card.id,
        label: card.title,
        labelKey: card.title,
        data: card,
      });
      
      setBreadcrumbItems(newBreadcrumbItems);
    } else if (card.navigationUrl) {
      // Navigate to URL if no sub-cards
      // @ts-ignore - Navigation type inference
      navigation.navigate(card.navigationUrl as never);
    } else if (cardViewDataMap[card.id]) {
      // Show CardView for any card that has data in cardViewDataMap
      setSelectedCardView(card.id);
      // Build breadcrumb based on card context
      const newBreadcrumbItems: BreadcrumbItem[] = [
        {
          id: 'back-to-indicators',
          label: 'Back to Indicator Types',
          labelKey: 'admin.backToIndicatorTypes',
          data: null,
        },
      ];
      
      // Check if this is an outcome indicator topic card
      if (card.id === 'income-household-participant' || 
          card.id === 'asset-accumulation-household-participant' ||
          card.id === 'savings' ||
          card.id === 'record-keeping' ||
          card.id === 'debt-credit' ||
          card.id === 'social-empowerment-dignity') {
        // Outcome indicator topic cards
        newBreadcrumbItems.push({
          id: 'outcome-indicators',
          label: 'Outcome Indicators',
          labelKey: 'admin.outcomeIndicators.title',
          data: null,
        });
        newBreadcrumbItems.push({
          id: 'cumulative-indicators',
          label: 'Cumulative',
          labelKey: 'admin.outcomeIndicators.types.cumulative.title',
          data: null,
        });
      } else {
        // Output indicator topic cards
        newBreadcrumbItems.push({
          id: 'output-indicators',
          label: 'Output Indicators',
          labelKey: 'admin.outputIndicators.title',
          data: null,
        });
      }
      
      // Add the current card
      newBreadcrumbItems.push({
        id: card.id,
        label: card.title,
        labelKey: card.title,
        data: card,
      });
      
      setBreadcrumbItems(newBreadcrumbItems);
    }
  };

  // Handle breadcrumb item click - navigate to that level
  const handleBreadcrumbClick = (item: BreadcrumbItem, index: number) => {
    // If clicked on "Back to Indicator Types" (index 0), go back to root
    if (item.id === 'back-to-indicators' || index === 0) {
      setCurrentCards(cards);
      setBreadcrumbItems([]);
      setSelectedCardView(null);
      return;
    }

    // If clicked on output-indicators, show output indicator topic cards
    if (item.id === 'output-indicators') {
      const outputIndicatorsCard = cards.find(c => c.id === 'output-indicators');
      if (outputIndicatorsCard && outputIndicatorsCard.subCards) {
        setCurrentCards(outputIndicatorsCard.subCards);
        setSelectedCardView(null);
        setBreadcrumbItems([
          {
            id: 'back-to-indicators',
            label: 'Back to Indicator Types',
            labelKey: 'admin.backToIndicatorTypes',
            data: null,
          },
          {
            id: 'output-indicators',
            label: 'Output Indicators',
            labelKey: 'admin.outputIndicators.title',
            data: outputIndicatorsCard,
          },
        ]);
      }
      return;
    }

    // If clicked on outcome-indicators, show outcome indicator type cards
    if (item.id === 'outcome-indicators') {
      const outcomeIndicatorsCard = cards.find(c => c.id === 'outcome-indicators');
      if (outcomeIndicatorsCard && outcomeIndicatorsCard.subCards) {
        setCurrentCards(outcomeIndicatorsCard.subCards);
        setSelectedCardView(null);
        setBreadcrumbItems([
          {
            id: 'back-to-indicators',
            label: 'Back to Indicator Types',
            labelKey: 'admin.backToIndicatorTypes',
            data: null,
          },
          {
            id: 'outcome-indicators',
            label: 'Outcome Indicators',
            labelKey: 'admin.outcomeIndicators.title',
            data: outcomeIndicatorsCard,
          },
        ]);
      }
      return;
    }

    // If clicked on cumulative-indicators or individual-indicators, show their topic cards
    if (item.id === 'cumulative-indicators' || item.id === 'individual-indicators') {
      // Find the card from the outcome indicator type cards
      const outcomeIndicatorsCard = cards.find(c => c.id === 'outcome-indicators');
      if (outcomeIndicatorsCard && outcomeIndicatorsCard.subCards) {
        const typeCard = outcomeIndicatorsCard.subCards.find(c => c.id === item.id);
        if (item.id === 'individual-indicators' && typeCard) {
          enterIndividualIndicators(outcomeIndicatorsCard, typeCard);
          return;
        }
        if (typeCard && typeCard.subCards) {
          setCurrentCards(typeCard.subCards);
          setSelectedCardView(null);
          setBreadcrumbItems([
            {
              id: 'back-to-indicators',
              label: 'Back to Indicator Types',
              labelKey: 'admin.backToIndicatorTypes',
              data: null,
            },
            {
              id: 'outcome-indicators',
              label: 'Outcome Indicators',
              labelKey: 'admin.outcomeIndicators.title',
              data: outcomeIndicatorsCard,
            },
            {
              id: item.id,
              label: item.label,
              labelKey: item.labelKey,
              data: typeCard,
            },
          ]);
        }
      }
      return;
    }

    // Remove items after the clicked index
    const newBreadcrumbItems = breadcrumbItems.slice(0, index + 1);
    setBreadcrumbItems(newBreadcrumbItems);

    // Find the card data from breadcrumb
    const cardData = item.data as DashboardCard;
    if (cardData && cardData.subCards) {
      setCurrentCards(cardData.subCards);
      setSelectedCardView(null);
    } else if (cardData && cardViewDataMap[cardData.id]) {
      setSelectedCardView(cardData.id);
    }
  };

  // Handle back arrow click
  const handleBackClick = () => {
    if (breadcrumbItems.length > 0) {
      // Remove last breadcrumb item
      const newBreadcrumbItems = breadcrumbItems.slice(0, -1);
      setBreadcrumbItems(newBreadcrumbItems);

      if (newBreadcrumbItems.length === 0) {
        // Back to original cards
        setCurrentCards(cards);
        setSelectedCardView(null);
      } else if (newBreadcrumbItems.length === 1) {
        // Back to root (indicator types)
        setCurrentCards(cards);
        setSelectedCardView(null);
        setBreadcrumbItems([]);
      } else {
        // Show sub-cards of previous level
        const previousItem = newBreadcrumbItems[newBreadcrumbItems.length - 1];
        if (previousItem.id === 'outcome-indicators') {
          const outcomeIndicatorsCard = cards.find(c => c.id === 'outcome-indicators');
          if (outcomeIndicatorsCard?.subCards) {
            setCurrentCards(outcomeIndicatorsCard.subCards);
            setSelectedCardView(null);
          }
          return;
        }
        if (previousItem.id === 'output-indicators') {
          const outputIndicatorsCard = cards.find(c => c.id === 'output-indicators');
          if (outputIndicatorsCard?.subCards) {
            setCurrentCards(outputIndicatorsCard.subCards);
            setSelectedCardView(null);
          }
          return;
        }

        const previousCard = previousItem.data as DashboardCard;
        if (previousCard && previousCard.subCards) {
          setCurrentCards(previousCard.subCards);
          setSelectedCardView(null);
        } else if (previousCard && cardViewDataMap[previousCard.id]) {
          setSelectedCardView(previousCard.id);
        }
      }
    }
  };

  // Calculate card width based on number of cards
  const getCardWidth = (totalCards: number) => {
    if (totalCards === 1) {
      return '100%';
    } else if (totalCards === 2) {
      return 'calc(50% - 8px)'; // 50% each with gap
    } else if (totalCards === 3) {
      return 'calc(33.333% - 10.67px)'; // 100/3 with gap
    } else if (totalCards >= 4) {
      return 'calc(25% - 12px)'; // 4 per row, remaining wrap
    }
    return 'calc(25% - 12px)'; // Default: 4 per row
  };

  const cardWidth = getCardWidth(currentCards.length);

  // Show CardView if a card view is selected
  if (selectedCardView && cardViewData) {
    return (
      <VStack space="md">
        {/* Breadcrumb */}
        {breadcrumbItems.length > 0 && (
          <Breadcrumb
            items={breadcrumbItems}
            onItemClick={handleBreadcrumbClick}
            onBackClick={handleBackClick}
            separator="/"
            showBackArrow={true}
          />
        )}

        {/* CardView */}
        <CardView
          cardViewId={selectedCardView}
          tabs={cardViewData.tabs}
          metricCards={cardViewData.metricCards}
          sections={cardViewData.sections}
          breakdownSections={cardViewData.breakdownSections}
          graphsBlocks={cardViewData.graphsBlocks}
          graphsPlaceholderKey={cardViewData.graphsPlaceholderKey}
          insightsTitle={cardViewData.insightsTitle}
          insightsItems={cardViewData.insightsItems}
        />
      </VStack>
    );
  }

  return (
    <VStack space="md">
      {/* Breadcrumb - Only shown when there's hierarchy */}
      {breadcrumbItems.length > 0 && (
        <Breadcrumb
          items={breadcrumbItems}
          onItemClick={handleBreadcrumbClick}
          onBackClick={handleBackClick}
          separator="/"
          showBackArrow={true}
        />
      )}

      {/* Info Card - Show dynamic heading based on current level */}
      {breadcrumbItems.length > 0 ? (
        <Card {...dashboardCardsStyles.infoCard}>
          <Heading {...dashboardCardsStyles.infoHeading}>
            {(() => {
              const lastBreadcrumb = breadcrumbItems[breadcrumbItems.length - 1];
              if (lastBreadcrumb?.id === 'individual-indicators') {
                const ready = !!individualPathway && !!individualParticipant;
                return ready
                  ? t('admin.outputIndicators.selectTopic')
                  : t('admin.outcomeIndicators.types.individual.selectParticipantFilters');
              }
              if (lastBreadcrumb?.id === 'outcome-indicators') {
                return t('admin.outcomeIndicators.selectOutcomeType');
              }
              if (lastBreadcrumb?.id === 'cumulative-indicators' || lastBreadcrumb?.id === 'individual-indicators') {
                return t('admin.outputIndicators.selectTopic');
              }
              return t('admin.outputIndicators.selectTopic');
            })()}
          </Heading>
          <Text {...dashboardCardsStyles.infoText}>
            {(() => {
              const lastBreadcrumb = breadcrumbItems[breadcrumbItems.length - 1];
              if (lastBreadcrumb?.id === 'individual-indicators') {
                const ready = !!individualPathway && !!individualParticipant;
                return ready
                  ? t('admin.outputIndicators.selectTopicDescription')
                  : t('admin.outcomeIndicators.types.individual.selectParticipantFiltersDescription');
              }
              if (lastBreadcrumb?.id === 'outcome-indicators') {
                return t('admin.outcomeIndicators.selectOutcomeTypeDescription');
              }
              if (lastBreadcrumb?.id === 'cumulative-indicators' || lastBreadcrumb?.id === 'individual-indicators') {
                return t('admin.outputIndicators.selectTopicDescription');
              }
              return t('admin.outputIndicators.selectTopicDescription');
            })()}
          </Text>
        </Card>
      ) : (
        infoHeadingKey && infoDescriptionKey && (
          <Card {...dashboardCardsStyles.infoCard}>
            <Heading {...dashboardCardsStyles.infoHeading}>
              {t(infoHeadingKey)}
            </Heading>
            <Text {...dashboardCardsStyles.infoText}>
              {t(infoDescriptionKey)}
            </Text>
          </Card>
        )
      )}

      {/* Individual Indicators: filter screen + conditional topic cards */}
      {isIndividualIndicatorsScreen ? (
        <VStack space="lg">
          <Card
            size="md"
            variant="outline"
            borderColor="$borderColor"
            borderRadius="$xl"
            p="$6"
          >
            <VStack space="md">
              <Heading size="sm" fontWeight="$medium" color="$textForeground">
                {t('admin.outcomeIndicators.types.individual.requiredFilters')}
              </Heading>
              <HStack space="lg" alignItems="flex-start" flexWrap="wrap">
                <VStack space="sm" flex={1} minWidth={320}>
                  <HStack space="xs" alignItems="center">
                    <Text color="$textForeground">
                      {`1. ${t('admin.outcomeIndicators.types.individual.pathwayLabel')}`}
                    </Text>
                    <Text color="$error600">*</Text>
                  </HStack>
                  <Select
                    options={pathwayOptions}
                    value={individualPathway}
                    onChange={(val: string) => {
                      setIndividualPathway(val);
                      setIndividualParticipant('');
                    }}
                    placeholder={t('admin.outcomeIndicators.types.individual.pathwayPlaceholder')}
                  />
                  {individualPathway ? (
                    <HStack mt="$2">
                      <Badge bg="$textSecondary" borderRadius="$md" px="$2" py="$0.5">
                        <BadgeText color="$white" fontSize="$xs">
                          {`Pathway: ${pathwayOptions.find(o => o.value === individualPathway)?.name ?? individualPathway}`}
                        </BadgeText>
                      </Badge>
                    </HStack>
                  ) : null}
                </VStack>

                <VStack space="sm" flex={1} minWidth={320}>
                  <HStack space="xs" alignItems="center">
                    <Text color="$textForeground">
                      {`2. ${t('admin.outcomeIndicators.types.individual.participantLabel')}`}
                    </Text>
                    <Text color="$error600">*</Text>
                  </HStack>
                  <Select
                    options={participantOptions}
                    value={individualParticipant}
                    onChange={(val: string) => setIndividualParticipant(val)}
                    placeholder={
                      individualPathway
                        ? t('admin.outcomeIndicators.types.individual.participantPlaceholder')
                        : t('admin.outcomeIndicators.types.individual.participantPlaceholderDisabled')
                    }
                    disabled={!individualPathway}
                  />
                </VStack>
              </HStack>
            </VStack>
          </Card>

          {individualPathway && individualParticipant ? (
            <HStack {...dashboardCardsStyles.cardsContainer}>
              {individualIndicatorTopicCards.map(card => (
                <Pressable
                  key={card.id}
                  {...dashboardCardsStyles.pressable}
                  style={{
                    flexBasis: 'calc(25% - 12px)',
                    width: 'calc(25% - 12px)',
                    maxWidth: 'calc(25% - 12px)',
                    flexShrink: 0,
                    flexGrow: 0,
                  } as any}
                  onPress={() => handleCardPress(card)}
                >
                  <Card
                    {...dashboardCardsStyles.card}
                    borderColor={hoveredCardId === card.id ? '$primary500' : '$borderColor'}
                    // @ts-ignore
                    onMouseEnter={() => setHoveredCardId(card.id)}
                    onMouseLeave={() => setHoveredCardId(null)}
                  >
                    <VStack {...dashboardCardsStyles.cardContent}>
                      <HStack {...dashboardCardsStyles.iconTitleRow}>
                        <HStack {...dashboardCardsStyles.iconTitleContainer}>
                          <Box
                            {...dashboardCardsStyles.iconBox}
                            bg={card.iconColor || dashboardCardsStyles.iconBoxDefaultBg}
                          >
                            <LucideIcon
                              name={card.icon || 'Circle'}
                              size={dashboardCardsStyles.iconSize}
                              color={dashboardCardsStyles.iconColor}
                            />
                          </Box>
                          <VStack {...dashboardCardsStyles.titleContainer}>
                            <Text {...dashboardCardsStyles.titleText}>{t(card.title)}</Text>
                          </VStack>
                        </HStack>
                        <Box {...dashboardCardsStyles.chevronIconContainer}>
                          <LucideIcon name="ChevronRight" {...dashboardCardsStyles.chevronIcon} />
                        </Box>
                      </HStack>
                      <Text {...dashboardCardsStyles.descriptionText}>{t(card.description)}</Text>
                    </VStack>
                  </Card>
                </Pressable>
              ))}
            </HStack>
          ) : (
            <Card
              size="md"
              variant="outline"
              borderColor="$borderColor"
              borderRadius="$xl"
              p="$10"
              alignItems="center"
              justifyContent="center"
              minHeight={260}
            >
              <VStack space="md" alignItems="center">
                <Box
                  borderWidth={2}
                  borderColor="$textMutedForeground"
                  borderRadius="$full"
                  width={48}
                  height={48}
                  alignItems="center"
                  justifyContent="center"
                >
                  <LucideIcon name="AlertCircle" size={22} color="$textMutedForeground" />
                </Box>
                <Text fontSize="$md" color="$textMutedForeground">
                  {t('admin.outcomeIndicators.types.individual.emptyStateTitle')}
                </Text>
                <Text fontSize="$sm" color="$textMutedForeground">
                  {t('admin.outcomeIndicators.types.individual.emptyStateSubtitle')}
                </Text>
              </VStack>
            </Card>
          )}
        </VStack>
      ) : null}

      {/* Indicator Cards */}
      {!isIndividualIndicatorsScreen ? (
        <HStack {...dashboardCardsStyles.cardsContainer}>
      {currentCards.map(card => (
        <Pressable
          key={card.id}
          {...dashboardCardsStyles.pressable}
          style={{
            flexBasis: cardWidth,
            width: cardWidth,
            maxWidth: cardWidth,
            flexShrink: 0,
            flexGrow: 0,
          } as any}
          onPress={() => handleCardPress(card)}
        >
          <Card 
            {...dashboardCardsStyles.card}
            borderColor={hoveredCardId === card.id ? '$primary500' : '$borderColor'}
            // @ts-ignore - Web-specific mouse events
            onMouseEnter={() => setHoveredCardId(card.id)}
            onMouseLeave={() => setHoveredCardId(null)}
            style={hoveredCardId === card.id ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            } : undefined}
          >
            <VStack {...dashboardCardsStyles.cardContent}>
              {/* Icon and Title Row */}
              <HStack {...dashboardCardsStyles.iconTitleRow}>
                <HStack {...dashboardCardsStyles.iconTitleContainer}>
                  {/* Icon Container */}
                  <Box
                    {...dashboardCardsStyles.iconBox}
                    bg={card.iconColor || dashboardCardsStyles.iconBoxDefaultBg}
                  >
                    <LucideIcon 
                      name={card.icon || 'Circle'} 
                      size={dashboardCardsStyles.iconSize} 
                      color={card.iconFillColor || dashboardCardsStyles.iconColor} 
                    />
                  </Box>

                  {/* Title */}
                  <VStack {...dashboardCardsStyles.titleContainer}>
                    <Text {...dashboardCardsStyles.titleText}>
                      {t(card.title)}
                    </Text>
                  </VStack>
                </HStack>

                {/* Right Arrow Icon */}
                <Box {...dashboardCardsStyles.chevronIconContainer}>
                  <LucideIcon 
                    name="ChevronRight" 
                    {...dashboardCardsStyles.chevronIcon}
                  />
                </Box>
              </HStack>

              {/* Description */}
              <Text {...dashboardCardsStyles.descriptionText}>
                {t(card.description)}
              </Text>

              {/* Topics Badge */}
              {card.status && (
                <HStack {...dashboardCardsStyles.badgeContainer}>
                  <Badge {...dashboardCardsStyles.badge}>
                    <BadgeText {...dashboardCardsStyles.badgeText}>
                      {t(card.status.label)}
                    </BadgeText>
                  </Badge>
                </HStack>
              )}
            </VStack>
          </Card>
        </Pressable>
      ))}
        </HStack>
      ) : null}
    </VStack>
  );
};

export default DashboardCards;
