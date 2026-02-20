import React, { useState, useMemo } from 'react';
import { HStack, Box, Card, VStack, Text, Pressable, Badge, BadgeText, Heading } from '@ui';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { dashboardCardsStyles } from './DashboardStyle';
import { DashboardCard, cardViewDataMap } from '@constants/ADMIN_DASHBOARD_CARDS';
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

  // Get card view data from constants
  const cardViewData = useMemo(() => {
    if (selectedCardView) {
      return cardViewDataMap[selectedCardView] || null;
    }
    return null;
  }, [selectedCardView]);

  // Handle card press - check for sub-cards first
  const handleCardPress = (card: DashboardCard) => {
    // If card has sub-cards, show them and update breadcrumb
    if (card.subCards && card.subCards.length > 0) {
      setCurrentCards(card.subCards);
      setSelectedCardView(null); // Clear card view when showing sub-cards
      // Add to breadcrumb with "Back to Indicator Types" as first item
      setBreadcrumbItems([
        {
          id: 'back-to-indicators',
          label: 'Back to Indicator Types',
          labelKey: 'admin.backToIndicatorTypes',
          data: null,
        },
        {
          id: card.id,
          label: card.title,
          labelKey: card.title,
          data: card,
        },
      ]);
    } else if (card.navigationUrl) {
      // Navigate to URL if no sub-cards
      // @ts-ignore - Navigation type inference
      navigation.navigate(card.navigationUrl as never);
    } else if (cardViewDataMap[card.id]) {
      // Show CardView for any card that has data in cardViewDataMap
      setSelectedCardView(card.id);
      // Update breadcrumb to show current path
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
          data: null,
        },
        {
          id: card.id,
          label: card.title,
          labelKey: card.title,
          data: card,
        },
      ]);
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
        // Back to output indicators - show topic cards
        const outputIndicatorsCard = cards.find(c => c.id === 'output-indicators');
        if (outputIndicatorsCard && outputIndicatorsCard.subCards) {
          setCurrentCards(outputIndicatorsCard.subCards);
          setSelectedCardView(null);
        }
      } else {
        // Show sub-cards of previous level
        const previousItem = newBreadcrumbItems[newBreadcrumbItems.length - 1];
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
              if (lastBreadcrumb?.id === 'outcome-indicators') {
                return t('admin.outcomeIndicators.selectOutcomeType');
              }
              return t('admin.outputIndicators.selectTopic');
            })()}
          </Heading>
          <Text {...dashboardCardsStyles.infoText}>
            {(() => {
              const lastBreadcrumb = breadcrumbItems[breadcrumbItems.length - 1];
              if (lastBreadcrumb?.id === 'outcome-indicators') {
                return t('admin.outcomeIndicators.selectOutcomeTypeDescription');
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

      {/* Indicator Cards */}
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
                      color={dashboardCardsStyles.iconColor} 
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
    </VStack>
  );
};

export default DashboardCards;
