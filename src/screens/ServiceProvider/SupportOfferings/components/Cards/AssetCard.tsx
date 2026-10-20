import React, { useCallback, useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  LucideIcon,
  Badge,
  BadgeText,
  useAlert,
  Button,
  ButtonText,
  ButtonIcon,
  ButtonSpinner,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useRequesterInfo } from '@hooks/useSessionStatus';
import { SESSION_STATUS_LABEL } from '@constants/SUPPORT_PROVIDER_CARDS';
import type { AssetItem } from '../../../../../types/supportOfferingsTypes';
import { cancelSession } from '../../../../../services/mentoringService';
import CancelInterventionModal from '../modals/CancelInterventionModal';
import AssetRequestsModal from '../modals/AssetRequestsModal';
import styles from '../../styles';

// ---------- Card ----------

interface CardProps {
  item: AssetItem;
  provinces?: any[];
  sites?: any[];
  // LC (via SessionsSupport) passes this to open its own participant-assignment flow instead
  // of the SP-only approve/decline requests modal this card opens by default.
  onViewRequests?: (item: AssetItem) => void;
}

const deliveryBadge = { label: 'Offline', icon: 'MapPin', bg: '$observationTaskBg', border: '#fde68a', color: '$warningIconColor' };

const Card: React.FC<CardProps> = ({ item: initialItem, provinces, sites, onViewRequests }) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [item, setItem] = useState<AssetItem>(initialItem);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  const getStatusColors = useCallback((status: string) => {
    switch (status) {
      case 'Upcoming':
        return { bg: '$blue50', border: '$blue200', text: '$blue600', icon: 'Clock' };
      case 'Accepted':
        return { bg: '$success50', border: '#a7f3d0', text: '$success600', icon: 'CheckCircle' };
      case 'Pending':
        return { bg: '$observationTaskBg', border: '#fde68a', text: '$warningIconColor', icon: 'AlertCircle' };
      case 'Cancelled':
        return { bg: '$error50', border: '$red200', text: '$red600', icon: 'XCircle' };
      case 'Rejected':
      default:
        return { bg: '$error50', border: 'transparent', text: '$error600', icon: 'XCircle' };
    }
  }, []);

  const getLocationValue = useCallback((assetItem: AssetItem, provinceList?: any[], siteList?: any[]) => {
    const provinceName = provinceList?.find((e: any) => e._id === assetItem.province)?.name;
    const siteNames = siteList?.filter((e: any) => e._id === assetItem.siteKey)?.map((e: any) => e.name).join(', ');
    const locationValue = assetItem.meeting_info_details?.location || assetItem.meeting_info?.location || provinceName || assetItem.location;
    return { siteNames, locationValue };
  }, []);

  const getClaimedCount = useCallback((assetItem: AssetItem) => {
    const hasParticipantCounts = assetItem.seats_limit !== undefined && assetItem.seats_remaining !== undefined;
    return hasParticipantCounts ? (assetItem.seats_limit || 0) - (assetItem.seats_remaining || 0) : undefined;
  }, []);

  const getTotalFund = useCallback((assetItem: AssetItem) => {
    const hasTotalFund = assetItem.estimatedValuePerParticipant !== undefined && assetItem.quantity !== undefined;
    return hasTotalFund ? (assetItem.estimatedValuePerParticipant || 0) * (assetItem.quantity || 0) : undefined;
  }, []);

  const statusColors = getStatusColors(item.status);
  const isUpcoming = item.status === 'Upcoming';
  const isCancelled = String(item.status || '').toLowerCase() === 'cancelled';

  const { siteNames, locationValue } = getLocationValue(item, provinces, sites);
  const { requesterOrgName } = useRequesterInfo(item as any);
  const claimed = getClaimedCount(item);
  const totalFund = getTotalFund(item);

  // The cancel API marks the session as CANCELLED (it is not deleted), so keep the card and show it as Cancelled
  const handleConfirmCancel = async (reason: string) => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      await cancelSession(item.id, reason);
      setItem((prev) => ({ ...prev, status: SESSION_STATUS_LABEL.CANCELLED }));
      setIsCancelModalOpen(false);
      showAlert('success', t('supportProvider.supportOfferings.cards.alerts.offeringCancelled', 'Intervention cancelled successfully!'));
    } catch (error) {
      showAlert('error', t('supportProvider.supportOfferings.cards.alerts.cancelFailed', 'Failed to cancel intervention. Please try again.'));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Box {...styles.cardContainer}>
      <VStack {...styles.cardFullVStack}>
        {/* ROW 1 - TITLE & BADGES */}
        <HStack {...styles.headerTopHStack}>
          <HStack {...styles.headerTitleBadgeHStack}>
            <Text {...styles.cardHeaderTitleText}>{item.title}</Text>

            <Badge {...styles.badgeContainer(statusColors.bg, statusColors.border)}>
              <HStack {...styles.badgeContentHStack}>
                <LucideIcon name={statusColors.icon} {...styles.badgeIconProps(statusColors.text)} />
                <BadgeText {...styles.badgeText(statusColors.text)}>{item.status}</BadgeText>
              </HStack>
            </Badge>

            {item.type ? (
              <Badge {...styles.inKindBadgeContainer}>
                <BadgeText {...styles.inKindBadgeText}>{item.type}</BadgeText>
              </Badge>
            ) : null}
          </HStack>

          <Badge {...styles.deliveryBadgeContainer(deliveryBadge.bg, deliveryBadge.border)}>
            <HStack {...styles.badgeContentHStack}>
              <LucideIcon name={deliveryBadge.icon} {...styles.badgeIconProps(deliveryBadge.color)} />
              <BadgeText {...styles.deliveryBadgeText(deliveryBadge.color)}>{deliveryBadge.label}</BadgeText>
            </HStack>
          </Badge>
        </HStack>

        {/* ROW 2 - DESCRIPTION */}
        {item.description ? (
          <Box {...styles.notesBox}>
            <Text {...styles.notesText} numberOfLines={2} ellipsizeMode="tail">
              {item.description}
            </Text>
          </Box>
        ) : null}

        {/* ROW 3 - METADATA */}
        <HStack {...styles.headerMetaHStack}>
          {item.sector ? (
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Package" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>{item.sector}</Text>
            </HStack>
          ) : null}

          {item.value ? (
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Banknote" {...styles.cardMetaIconProps} />
              <Text {...styles.cardValueBoldSmText}>{item.value}</Text>
            </HStack>
          ) : null}

          {claimed !== undefined ? (
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Users" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {`${claimed} / ${item.seats_limit} claimed (${item.seats_remaining} spots left)`}
              </Text>
            </HStack>
          ) : item.requests ? (
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Users" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>{item.requests}</Text>
            </HStack>
          ) : null}

          {totalFund !== undefined ? (
            <Badge {...styles.badgeContainer('$success50', '#a7f3d0')}>
              <BadgeText {...styles.badgeText('$success600')}>
                {`Total Fund: R ${totalFund} (${item.quantity} qty)`}
              </BadgeText>
            </Badge>
          ) : null}

          {locationValue ? (
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="MapPin" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {locationValue}{siteNames ? ` • ${siteNames}` : ''}
              </Text>
            </HStack>
          ) : null}
        </HStack>

        {/* ROW 4 - ACTIONS */}
        <HStack {...styles.requestedByRowHStack}>
          {item.mentor_name ? (
            <Text {...styles.cardRequestedByText}>
              {t('supportProvider.supportOfferings.cards.requestedByPrefix', 'Requested by: ')}
              <Text fontWeight="$normal" color="$textPrimary" fontSize={'$xs'}>
                {item.mentor_name}
              </Text>
              {requesterOrgName ? ` (${requesterOrgName})` : ''}
            </Text>
          ) : null}

          <HStack {...styles.badgeContentHStack}>
            {isUpcoming && (
              <Button
                // @ts-ignore
                variant="outlineghost" {...styles.cancelActionBtn}
                onPress={() => setIsCancelModalOpen(true)}
              >
                <ButtonIcon as={LucideIcon} name="X" {...styles.cardCopyIconProps} color={'$red600'} />
                {/* @ts-ignore */}
                <ButtonText {...styles.cancelActionBtnText}>
                  {t('supportProvider.supportOfferings.cards.cancel', 'Cancel')}
                </ButtonText>
              </Button>
            )}

            {!isCancelled && (
              <Button
                variant="solid" {...styles.detailsBtn}
                onPress={() => (onViewRequests ? onViewRequests(item) : setIsRequestsModalOpen(true))}
              >
                {/* @ts-ignore */}
                <ButtonText {...styles.detailsBtnText}>
                  {t('supportProvider.supportOfferings.cards.viewRequests')}
                </ButtonText>
              </Button>
            )}
          </HStack>
        </HStack>
      </VStack>

      <CancelInterventionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={item.title}
        statusLabel={item.status}
        participantsInfo={
          claimed !== undefined
            ? `${claimed} ${t('supportProvider.supportOfferings.cancelModal.assignedParticipants', 'assigned participants')}`
            : undefined
        }
        supportTypeLabel={t('supportProvider.supportOfferings.cancelModal.assetType', 'Asset')}
        location={locationValue}
        isSubmitting={isCancelling}
        onConfirmCancel={handleConfirmCancel}
      />

      <AssetRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        asset={item}
      />
    </Box>
  );
};

// ---------- ListCard ----------

interface AssetCardProps {
  items: AssetItem[];
  isShowLoadMore: boolean;
  onLoadMoreItems: () => void;
  isLoadingMore?: boolean;
  _card?: any;
}

export default function AssetCard({
  items = [],
  isShowLoadMore,
  onLoadMoreItems,
  isLoadingMore = false,
  _card,
}: AssetCardProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <VStack {...styles.listContainer}>
      {items.map((item) => (
        <Card key={item.id} {..._card} item={item} />
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
