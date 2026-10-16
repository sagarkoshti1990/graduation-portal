import React, { useCallback, useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import type { ServiceItem } from '../../../../../types/supportOfferingsTypes';
import { FORM_MODE, SESSION_STATUS_LABEL } from '@constants/SUPPORT_PROVIDER_CARDS';
import { useSessionStatus, useRequesterInfo } from '@hooks/useSessionStatus';
import { cancelSession } from '../../../../../services/mentoringService';
import CancelInterventionModal from '../modals/CancelInterventionModal';
import AdditionalServiceCompletionModal from '../modals/AdditionalServiceCompletionModal';
import styles from '../../styles';

// ---------- Card ----------

interface CardProps {
  item: ServiceItem;
  provinces?: any[];
  sites?: any[];
  footer?: (item: any) => React.ReactNode;
}

const Card: React.FC<CardProps> = ({ item, provinces, sites, footer }) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const navigation = useNavigation();

  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  const getStatusColors = (status: string) => {
    switch (status) {
      case SESSION_STATUS_LABEL.DRAFT:
        return { bg: '$backgroundLight100', border: 'transparent', text: '$textMuted', icon: 'FileText' };
      case SESSION_STATUS_LABEL.UPCOMING:
        return { bg: '$blue50', border: 'transparent', text: '$blue600', icon: 'Clock' };
      case SESSION_STATUS_LABEL.IN_PROGRESS:
        return { bg: '$observationTaskBg', border: 'transparent', text: '$warningIconColor', icon: 'AlertCircle' };
      case SESSION_STATUS_LABEL.CANCELLED:
        return { bg: '$error50', border: '$red200', text: '$red600', icon: 'XCircle' };
      case SESSION_STATUS_LABEL.COMPLETED:
      default:
        return { bg: '$success50', border: 'transparent', text: '$success600', icon: 'CheckCircle' };
    }
  };

  const { statusTag, isDraft, isUpcoming, isCancelled } = useSessionStatus(item as any, statusOverride);
  const statusColors = getStatusColors(statusTag);

  // Province / site names resolved from the option lists passed down from the parent screen
  const getOptionId = useCallback((e: any) => e?._id || e?.id || e?.value, []);
  const getOptionLabel = useCallback(
    (e: any) => e?.metaInformation?.name || e?.name || e?.title || e?.label,
    []
  );

  const matchedProvince = provinces?.find(
    (e: any) => getOptionId(e) === (item as any)?.provinces?.[0] || getOptionId(e) === (item as any)?.meta?.provinces?.[0]
  );
  const provinceName = matchedProvince ? getOptionLabel(matchedProvince) : undefined;

  const siteNames = sites?.filter(
    (e: any) => (item as any)?.sites?.includes(getOptionId(e)) || (item as any)?.meta?.sites?.includes(getOptionId(e))
  )?.map((e: any) => getOptionLabel(e)).join(', ');

  const seatsLimit = (item as any)?.seats_limit;
  const seatsRemaining = (item as any)?.seats_remaining;
  const assignedCount = useMemo(
    () =>
      seatsLimit !== undefined && seatsRemaining !== undefined
        ? Math.max(0, Number(seatsLimit || 0) - Number(seatsRemaining || 0))
        : undefined,
    [seatsLimit, seatsRemaining]
  );
  const participantsDisplay = `${assignedCount ?? 0} / ${seatsLimit ?? 0} participants`;

  const { requesterName, requesterOrgName } = useRequesterInfo(item as any);

  // The cancel API marks the session as CANCELLED (it is not deleted), so keep the card and show it as Cancelled
  const handleConfirmCancel = async (reason: string) => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      await cancelSession(item.id, reason);
      setStatusOverride(SESSION_STATUS_LABEL.CANCELLED);
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
        {/* ROW 1 - TITLE & BADGE */}
        <HStack {...styles.headerTopHStack}>
          <HStack {...styles.headerTitleBadgeHStack}>
            <Text {...styles.cardHeaderTitleText}>{item.title}</Text>

            <Badge {...styles.badgeContainer(statusColors.bg, statusColors.border)}>
              <HStack {...styles.badgeContentHStack}>
                <LucideIcon name={statusColors.icon} {...styles.badgeIconProps(statusColors.text)} />
                <BadgeText {...styles.badgeText(statusColors.text)}>{statusTag}</BadgeText>
              </HStack>
            </Badge>
          </HStack>
        </HStack>

        {/* ROW 2 - NOTES / DESCRIPTION */}
        {item.description ? (
          <Box {...styles.notesBox}>
            <Text {...styles.notesText} numberOfLines={2} ellipsizeMode="tail">
              {item.description}
            </Text>
          </Box>
        ) : null}

        {/* ROW 3 - METADATA */}
        <HStack {...styles.headerMetaHStack}>
          <HStack {...styles.trainingMetaItemHStack}>
            <LucideIcon name="MapPin" {...styles.cardMetaIconProps} />
            <Text {...styles.cardMetaSmText}>
              {provinceName || item.location || '-'}{siteNames ? ` • ${siteNames}` : (item.hubOffice ? ` • ${item.hubOffice}` : '')}
            </Text>
          </HStack>

          {item.site ? (
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Building2" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>{item.site}</Text>
            </HStack>
          ) : null}

          <HStack {...styles.trainingMetaItemHStack}>
            <LucideIcon name="Users" {...styles.cardMetaIconProps} />
            <Text {...styles.cardMetaSmText}>
              {participantsDisplay}
            </Text>
          </HStack>
        </HStack>

        {/* ROW 4 - ACTIONS */}
        {footer ? (
          footer(item)
        ) : (
        <HStack {...styles.requestedByRowHStack}>
          {requesterName ? (
            <Text {...styles.cardRequestedByText}>
              {t('supportProvider.supportOfferings.cards.requestedByPrefix', 'Requested by: ')}
              <Text fontWeight="$normal" color="$textPrimary" fontSize={'$xs'}>
                {requesterName}
              </Text>
              {requesterOrgName ? ` (${requesterOrgName})` : ''}
            </Text>
          ) : null}

          <HStack {...styles.badgeContentHStack}>
            {/* UPCOMING: Cancel */}
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

            {/* DRAFT: Edit */}
            {isDraft && (
              <Button
                // @ts-ignore
                variant="outlineghost" {...styles.outlineActionBtn}
                onPress={() => (navigation as any).navigate('create-additional-service', { id: item.id, type: FORM_MODE.EDIT })}
              >
                <ButtonIcon as={LucideIcon} name="Pencil" {...styles.cardCopyIconProps} />
                {/* @ts-ignore */}
                <ButtonText {...styles.outlineActionBtnText}>
                  {t('common.edit', 'Edit')}
                </ButtonText>
              </Button>
            )}

            {/* NON-DRAFT: View Requests (a draft is not published, so it has no requests or attendance yet) */}
            {!isDraft && !isCancelled && (
              <Button
                variant="solid" {...styles.detailsBtn}
                onPress={() => setIsRequestsModalOpen(true)}
              >
                {/* @ts-ignore */}
                <ButtonText {...styles.detailsBtnText}>
                  {t('supportProvider.supportOfferings.cards.viewRequests')}
                </ButtonText>
              </Button>
            )}
          </HStack>
        </HStack>
        )}
      </VStack>

      <CancelInterventionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={item.title}
        statusLabel={statusTag}
        participantsInfo={
          assignedCount !== undefined
            ? `${assignedCount} ${t('supportProvider.supportOfferings.cancelModal.assignedParticipants', 'assigned participants')}`
            : undefined
        }
        supportTypeLabel={t('supportProvider.supportOfferings.cancelModal.additionalServiceType', 'Additional Service')}
        location={provinceName || item.location}
        isSubmitting={isCancelling}
        onConfirmCancel={handleConfirmCancel}
      />

      <AdditionalServiceCompletionModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        service={item}
        onCompleted={() => setStatusOverride(SESSION_STATUS_LABEL.COMPLETED)}
      />
    </Box>
  );
};

// ---------- ListCard ----------

interface AdditionalServicesCardProps {
  items: ServiceItem[];
  isShowLoadMore: boolean;
  onLoadMoreItems: () => void;
  isLoadingMore?: boolean;
  _card?: any;
}

export default function AdditionalServicesCard({
  items = [],
  isShowLoadMore,
  onLoadMoreItems,
  isLoadingMore = false,
  _card,
}: AdditionalServicesCardProps): React.ReactElement {
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
