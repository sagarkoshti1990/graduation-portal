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
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
// Read-only reuse of the existing card style tokens (title/badge/description/meta rows) so this
// LC-only card visually matches the rest of the offerings UI without touching the shared
// ServiceProvider/SupportOfferings components used by the SP side.
import soStyles from '../../ServiceProvider/SupportOfferings/styles';
// Footer styles (Provided by + View Details) already defined for the LC requestor flow.
import lcStyles from '../styles';
import { SESSION_STATUS, SESSION_STATUS_LABEL } from '@constants/SUPPORT_PROVIDER_CARDS';

// ---------- Card ----------

interface AdditionalServiceCardItemProps {
  item: any;
  provinces?: any[];
  sites?: any[];
}

const getStatusColors = (status: string) => {
  switch (status) {
    case SESSION_STATUS_LABEL.DRAFT:
      return { bg: '$backgroundLight100', border: 'transparent', text: '$textMuted', icon: 'FileText' };
    case SESSION_STATUS_LABEL.UPCOMING:
      return { bg: '$blue50', border: 'transparent', text: '$blue600', icon: 'Clock' };
    case SESSION_STATUS_LABEL.IN_PROGRESS:
      return { bg: '$observationTaskBg', border: 'transparent', text: '$warningIconColor', icon: 'AlertCircle' };
    case SESSION_STATUS_LABEL.COMPLETED:
    default:
      return { bg: '$success50', border: 'transparent', text: '$success600', icon: 'CheckCircle' };
  }
};

/**
 * Mirrors TrainingCard's formatStatus() - the raw backend `status` (DRAFT/PUBLISHED/COMPLETED)
 * isn't what should be shown on the badge; it needs to be turned into a display status
 * (Upcoming/In progress/Completed) based on the offering's start/end dates.
 */
const formatDisplayStatus = (item: any): string => {
  const rawStatus = (item.status || '').toUpperCase();

  if (rawStatus === SESSION_STATUS.DRAFT) return SESSION_STATUS_LABEL.DRAFT;
  if (rawStatus === SESSION_STATUS.COMPLETED) return SESSION_STATUS_LABEL.COMPLETED;

  if (item.start_date) {
    const toMs = (value: any) =>
      typeof value === 'number' || !isNaN(Number(value)) ? Number(value) * 1000 : new Date(value).getTime();
    const startMs = toMs(item.start_date);
    const endMs = item.end_date ? toMs(item.end_date) : undefined;
    const nowMs = Date.now();

    if (endMs !== undefined && nowMs > endMs) return SESSION_STATUS_LABEL.COMPLETED;
    if (nowMs < startMs) return SESSION_STATUS_LABEL.UPCOMING;
    return SESSION_STATUS_LABEL.IN_PROGRESS;
  }

  return item.status || SESSION_STATUS_LABEL.UPCOMING;
};

/**
 * The "Both" pill (top-right) reflects who the service is recommended for - the backend already
 * sends this as `recommended_for: [{ value, label }]` (e.g. [{value:'user', label:'Participant'}]).
 * When both audience types are present, show the combined "Both" label like the Figma design.
 */
const getAudienceLabel = (item: any, t: (key: string) => string): string => {
  const recommendedFor: any[] = Array.isArray(item.recommended_for) ? item.recommended_for : [];
  if (recommendedFor.length === 0) return '';

  const values = recommendedFor.map((r) => (typeof r === 'object' ? r.value : r));
  const hasOrgAdmin = values.includes('org_admin');
  const hasUser = values.includes('user');

  if (hasOrgAdmin && hasUser) return t('supportProvider.supportOfferings.cards.bothAudience');
  return recommendedFor[0]?.label || recommendedFor[0] || '';
};

const Card: React.FC<AdditionalServiceCardItemProps> = ({ item, provinces, sites }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();

  const displayStatus = formatDisplayStatus(item);
  const statusColors = getStatusColors(displayStatus);
  const audienceLabel = getAudienceLabel(item, t);

  const providedByName = item.providedBy || item.mentor_name || (typeof item.organization === 'object' ? item.organization?.name : item.organization) || '';

  // `item.provinces`/`item.sites` are raw ids - resolve them to display names instead of
  // showing the ids (or nothing) directly.
  const rawProvinceId = (Array.isArray(item.provinces) ? item.provinces[0] : item.provinces)
    || item.province
    || item?.meta?.provinces?.[0]
    || '';
  const provinceName = provinces?.find((p: any) => p._id === rawProvinceId)?.name || rawProvinceId;

  const rawSiteIds: string[] = Array.isArray(item.sites) ? item.sites : (item.site ? [item.site] : (item?.meta?.sites || []));
  const siteNames = rawSiteIds
    .map((id) => sites?.find((s: any) => s._id === id)?.name || id)
    .filter(Boolean)
    .join(', ');

  const maxParticipants = item.seats_limit || 0;
  const seatsRemaining = item.seats_remaining ?? maxParticipants;
  const assignedCount = Math.max(0, maxParticipants - seatsRemaining);

  const handleViewDetails = () => {
    (navigation as any).navigate('session-details', { sessionId: item.id });
  };

  return (
    <Box {...soStyles.cardContainer}>
      <VStack space="sm">
        {/* Row 1: Title + Status Badge (left) / Audience Badge (right) */}
        <HStack {...soStyles.titleRowHStack} justifyContent="space-between" width="100%">
          <HStack {...soStyles.headerTitleBadgeHStack}>
            <Text {...soStyles.cardTitleText}>{item.title}</Text>
            <Badge {...soStyles.badgeContainer(statusColors.bg)}>
              <HStack {...soStyles.badgeContentHStack}>
                <LucideIcon name={statusColors.icon} {...soStyles.badgeIconProps(statusColors.text)} />
                <BadgeText {...soStyles.badgeText(statusColors.text)}>{displayStatus}</BadgeText>
              </HStack>
            </Badge>
          </HStack>

          {audienceLabel ? (
            <Badge {...soStyles.badgeContainer('$primary100')}>
              <BadgeText {...soStyles.badgeText('$primary500')}>{audienceLabel}</BadgeText>
            </Badge>
          ) : null}
        </HStack>

        {/* Row 2: Description */}
        {item.description ? (
          <Box {...soStyles.notesBox}>
            <Text {...soStyles.notesText} numberOfLines={2} ellipsizeMode="tail">
              {item.description}
            </Text>
          </Box>
        ) : null}

        {/* Row 3: Meta (province, site, requests) */}
        <HStack {...soStyles.metaRowHStack}>
          {provinceName ? (
            <HStack {...soStyles.metaItemHStack}>
              <LucideIcon name="MapPin" {...soStyles.cardMetaIconProps} />
              <Text {...soStyles.cardMetaSmText}>{provinceName}</Text>
            </HStack>
          ) : null}

          {siteNames ? (
            <HStack {...soStyles.metaItemHStack}>
              <LucideIcon name="Building2" {...soStyles.cardMetaIconProps} />
              <Text {...soStyles.cardMetaSmText}>{siteNames}</Text>
            </HStack>
          ) : null}

          {maxParticipants > 0 ? (
            <HStack {...soStyles.metaItemHStack}>
              <LucideIcon name="Users" {...soStyles.cardMetaIconProps} />
              <Text {...soStyles.cardMetaSmText}>
                {assignedCount} / {maxParticipants} {t('lc.sessionsSupport.mySessionCard.participants')}
              </Text>
            </HStack>
          ) : null}
        </HStack>

        {/* Row 4: Footer - Provided by + View Details */}
        <HStack {...lcStyles.requestorFooter}>
          <Text {...lcStyles.requestorFooterText}>
            {t('supportProvider.supportOfferings.cards.providedBy')}{' '}
            <Text {...lcStyles.requestorFooterOrgText}>{providedByName}</Text>
            {/* {provinceName ? (
              <Text {...lcStyles.requestorFooterProvinceText}>{` • ${provinceName}`}</Text>
            ) : null} */}
          </Text>

          <HStack {...lcStyles.requestorFooterActions}>
            <Button
              variant={'outlineghost' as any}
              {...lcStyles.requestorFooterViewDetailsButton}
              onPress={handleViewDetails}
            >
              <ButtonText {...(lcStyles.requestorFooterViewDetailsText as any)}>
                {t('supportProvider.supportOfferings.cards.viewDetails')}
              </ButtonText>
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};

// ---------- List ----------

export interface AdditionalServiceCardProps {
  items: any[];
  isShowLoadMore?: boolean;
  onLoadMoreItems?: () => void;
  isLoadingMore?: boolean;
  provinces?: any[];
  sites?: any[];
}

export default function AdditionalServiceCard({
  items = [],
  isShowLoadMore,
  onLoadMoreItems,
  isLoadingMore = false,
  provinces,
  sites,
}: AdditionalServiceCardProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <VStack {...soStyles.listContainer}>
      {items.map((item) => (
        <Card key={item.id} item={item} provinces={provinces} sites={sites} />
      ))}
      {isShowLoadMore && (
        <Box alignItems="center" mt="$4" width="100%">
          <Button onPress={onLoadMoreItems} disabled={isLoadingMore}>
            {isLoadingMore && <ButtonSpinner mr="$2" color="$white" />}
            <ButtonText>{t('supportProvider.supportOfferings.buttonTexts.loadMoreSessions')}</ButtonText>
          </Button>
        </Box>
      )}
    </VStack>
  );
}
