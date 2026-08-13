import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  LucideIcon,
  Badge,
  BadgeText,
  useAlert,
  Button,
  ButtonText,
  ButtonSpinner,
} from '@ui';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import type { ServiceItem } from '../../../../../types/supportOfferingsTypes';
import styles from '../../styles';

// ---------- Card ----------

interface CardProps {
  item: ServiceItem;
}

const Card: React.FC<CardProps> = ({ item }) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const navigation = useNavigation();

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return { bg: '$blue50', border: 'transparent', text: '$blue600', icon: 'Clock' };
      case 'In progress':
        return { bg: '$observationTaskBg', border: 'transparent', text: '$warningIconColor', icon: 'AlertCircle' };
      case 'Completed':
      default:
        return { bg: '$success50', border: 'transparent', text: '$success600', icon: 'CheckCircle' };
    }
  };

  const statusColors = getStatusColors(item.status);

  return (
    <Box {...styles.cardContainer}>
      <HStack {...styles.cardHeaderHStack}>
        {/* Left Side: Info */}
        <VStack {...styles.cardLeftVStack}>
          {/* Row 1: Title + Badge */}
          <HStack {...styles.titleRowHStack}>
            <Text {...styles.cardTitleText}>
              {item.title}
            </Text>
            <Badge {...styles.badgeContainer(statusColors.bg)}>
              <HStack {...styles.badgeContentHStack}>
                <LucideIcon name={statusColors.icon} {...styles.badgeIconProps(statusColors.text)} />
                <BadgeText {...styles.badgeText(statusColors.text)}>
                  {item.status}
                </BadgeText>
              </HStack>
            </Badge>
          </HStack>

          {/* Row 2: Description */}
          {item.description ? (
            <Text {...styles.cardDescriptionText}>
              {item.description}
            </Text>
          ) : null}

          {/* Row 3: Metadata */}
          <HStack {...styles.metaRowHStack}>
            <HStack {...styles.metaItemHStack}>
              <LucideIcon name="MapPin" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {item.location}{item.hubOffice ? ` • ${item.hubOffice}` : ''}
              </Text>
            </HStack>

            <HStack {...styles.metaItemHStack}>
              <LucideIcon name="Building2" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {item.site}
              </Text>
            </HStack>

            <HStack {...styles.metaItemHStack}>
              <LucideIcon name="Users" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {item.requests}
              </Text>
            </HStack>
          </HStack>
        </VStack>

        {/* Right Side: Action Buttons stacked vertically */}
        <VStack {...styles.cardRightActionStack}>
          <Pressable
            {...styles.viewRequestsBtn}
            onPress={() => {
              try {
                (navigation as any).navigate('requests');
              } catch (e) {
                showAlert('info', t('supportProvider.supportOfferings.cards.alerts.navigatingRequests'));
              }
            }}
          >
            <Text {...styles.cardBtnSecondaryText}>
              {t('supportProvider.supportOfferings.cards.viewRequests')}
            </Text>
          </Pressable>

          {item.actionType === 'copy' ? (
            <Pressable
              {...styles.copyOfferingBtn}
              onPress={() => showAlert('success', t('supportProvider.supportOfferings.cards.alerts.offeringCopied'))}
            >
              <HStack {...styles.pressableInnerHStack}>
                <LucideIcon name="Copy" {...styles.cardCopyIconProps} />
                <Text {...styles.cardBtnPrimaryText}>
                  {t('supportProvider.supportOfferings.cards.copyOffering')}
                </Text>
              </HStack>
            </Pressable>
          ) : (
            <Pressable
              {...styles.completeBtn}
              onPress={() => showAlert('success', t('supportProvider.supportOfferings.cards.alerts.offeringCompleted'))}
            >
              <HStack {...styles.pressableInnerHStack}>
                <LucideIcon name="CheckCircle" {...styles.cardWhiteIconProps} />
                <Text {...styles.cardBtnWhiteText}>
                  {t('supportProvider.supportOfferings.cards.complete')}
                </Text>
              </HStack>
            </Pressable>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

// ---------- ListCard ----------

interface AdditionalServicesCardProps {
  items: ServiceItem[];
  isShowLoadMore: boolean;
  onLoadMoreItems: () => void;
  isLoadingMore?: boolean;
}

export default function AdditionalServicesCard({
  items = [],
  isShowLoadMore,
  onLoadMoreItems,
  isLoadingMore = false,
}: AdditionalServicesCardProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <VStack {...styles.listContainer}>
      {items.map((item) => (
        <Card key={item.id} item={item} />
      ))}
      {isShowLoadMore && (
        <Box alignItems="center" mt="$4" width="100%">
          <Button onPress={onLoadMoreItems} disabled={isLoadingMore}>
            {isLoadingMore && <ButtonSpinner mr="$2" color="$white" />}
            <ButtonText>{t('common.loadMore', 'Load More')}</ButtonText>
          </Button>
        </Box>
      )}
    </VStack>
  );
}
