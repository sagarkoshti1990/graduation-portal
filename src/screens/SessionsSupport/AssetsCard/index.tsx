import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  LucideIcon,
  Badge,
  BadgeText,
  Button,
  ButtonText,
  ButtonSpinner,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import type { AssetItem } from '../../../types/supportOfferingsTypes';
// Read-only reuse of the existing card style tokens, mirroring AdditionalServiceCard's approach.
import soStyles from '../../ServiceProvider/SupportOfferings/styles';
import lcStyles from '../styles';

// ---------- Card ----------

interface AssetsCardItemProps {
  item: AssetItem;
  onRequestAsset?: (item: AssetItem) => void;
}

const Card: React.FC<AssetsCardItemProps> = ({ item, onRequestAsset }) => {
  const { t } = useLanguage();

  const availableQuantity = item.seats_remaining ?? item.quantity;
  const isAvailable = availableQuantity === undefined || availableQuantity > 0;
  const statusColors = isAvailable
    ? { bg: '$success50', text: '$success600', icon: 'CheckCircle' }
    : { bg: '$backgroundLight100', text: '$textMuted', icon: 'XCircle' };
  const statusLabel = isAvailable
    ? t('lc.sessionsSupport.assetsCard.available', 'Available')
    : t('lc.sessionsSupport.assetsCard.unavailable', 'Unavailable');

  const fundedByName =
    (typeof item.organization === 'object' ? item.organization?.name : item.organization) ||
    item.mentor_name ||
    '';

  const totalFund =
    item.estimatedValuePerParticipant !== undefined && item.quantity !== undefined
      ? item.estimatedValuePerParticipant * item.quantity
      : undefined;

  return (
    <Box {...soStyles.cardContainer}>
      <VStack space="sm">
        {/* Row 1: Title + Status Badge (left) / Category Badge (right) */}
        <HStack {...soStyles.titleRowHStack} justifyContent="space-between" width="100%">
          <HStack {...soStyles.headerTitleBadgeHStack}>
            <Text {...soStyles.cardTitleText}>{item.title}</Text>
            <Badge {...soStyles.badgeContainer(statusColors.bg)}>
              <HStack {...soStyles.badgeContentHStack}>
                <LucideIcon name={statusColors.icon} {...soStyles.badgeIconProps(statusColors.text)} />
                <BadgeText {...soStyles.badgeText(statusColors.text)}>{statusLabel}</BadgeText>
              </HStack>
            </Badge>
          </HStack>

          {/* {item.sector ? (
            <Badge {...soStyles.badgeContainer('$primary100')}>
              <BadgeText {...soStyles.badgeText('$primary500')}>{item.sector}</BadgeText>
            </Badge>
          ) : null} */}
        </HStack>

        {/* Row 2: Description */}
        {item.description ? (
          <Box {...soStyles.notesBox}>
            <Text {...soStyles.notesText} numberOfLines={2} ellipsizeMode="tail">
              {item.description}
            </Text>
          </Box>
        ) : null}

        {/* Row 3: Type + Value / Total Fund */}
        <HStack {...soStyles.metaRowHStack}>
          {item.type ? (
            <HStack {...soStyles.metaItemHStack}>
              <LucideIcon name="Box" {...soStyles.cardMetaIconProps} />
              <Text {...soStyles.cardMetaSmText}>{item.sector}</Text>
            </HStack>
          ) : null}

          {item.value ? (
            <HStack {...soStyles.metaItemHStack}>
              <Text {...soStyles.cardValueBoldSmText}>{item.value}</Text>
            </HStack>
          ) : null}

          {totalFund !== undefined ? (
            <HStack {...soStyles.metaItemHStack}>
              <Text {...soStyles.cardValueBoldSmText}>
                {t('lc.sessionsSupport.assetsCard.totalFund', { defaultValue: 'R {{amount}} Total Fund', amount: totalFund })}
              </Text>
            </HStack>
          ) : null}
        </HStack>

        {/* Row 4: Footer - Funded by + Request Asset */}
        <HStack {...lcStyles.requestorFooter}>
          <Text {...lcStyles.requestorFooterText}>
            {t('lc.sessionsSupport.assetsCard.fundedBy', 'Funded by:')}{' '}
            <Text {...lcStyles.requestorFooterOrgText}>{fundedByName}</Text>
          </Text>

          <HStack {...lcStyles.requestorFooterActions}>
            <Button
              variant="solid"
              {...lcStyles.requestorFooterViewDetailsButton}
              onPress={() => onRequestAsset?.(item)}
              disabled={!isAvailable}
              opacity={isAvailable ? 1 : 0.5}
            >
              <ButtonText {...(lcStyles.requestorFooterViewDetailsText as any)}>
                {t('lc.sessionsSupport.assetsCard.requestAsset', 'Request Asset')}
              </ButtonText>
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};

// ---------- List ----------

export interface AssetsCardProps {
  items: AssetItem[];
  isShowLoadMore?: boolean;
  onLoadMoreItems?: () => void;
  isLoadingMore?: boolean;
  onRequestAsset?: (item: AssetItem) => void;
}

export default function AssetsCard({
  items = [],
  isShowLoadMore,
  onLoadMoreItems,
  isLoadingMore = false,
  onRequestAsset,
}: AssetsCardProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <VStack {...soStyles.listContainer}>
      {items.map((item) => (
        <Card key={item.id} item={item} onRequestAsset={onRequestAsset} />
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
