import React from 'react';
import { Box, Button, ButtonText, HStack, VStack, Text, Badge, BadgeText, Spinner, LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import styles from './styles';
import { getStatusColors } from '../MyTraining&Sessions/LcMySessionTab';
import { SESSION_STATUS_LABEL } from '@constants/SUPPORT_PROVIDER_CARDS';

interface MyRequestsProps {
  items: any[];
  _loading: boolean;
  isShowLoadMore: boolean;
  onLoadMoreItems: () => void;
  isLoadingMore?: boolean;
}

const getStatusBadgeStyles = (status: string) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('accept') || normalized.includes('publish') || normalized.includes('approved') || normalized.includes('live')) {
    return {
      bg: '$green50',
      borderColor: '$green200',
      color: '$green600',
      label: 'Accepted',
    };
  }
  if (normalized.includes('decline') || normalized.includes('reject')) {
    return {
      bg: '$red50',
      borderColor: '$red200',
      color: '$red600',
      label: 'Declined',
    };
  }
  return {
    bg: '$yellow50',
    borderColor: '$yellow200',
    color: '$amber600',
    label: status || 'Requested',
  };
};

export const MyRequests: React.FC<MyRequestsProps> = ({
  items,
  _loading,
  isShowLoadMore,
  onLoadMoreItems,
  isLoadingMore,
}) => {
  const { t } = useLanguage();
  const navigation = useNavigation();

  if (_loading && items.length === 0) {
    return (
      <Box alignItems="center" justifyContent="center" py="$10" width="100%">
        <Spinner size="large" />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box {...styles.emptyStateContainer}>
        <VStack {...styles.emptyStateVStack}>
          <Box {...styles.emptyStateIconContainer}>
            <LucideIcon name="Clock" size={30} color="$textMutedForeground" />
          </Box>
          <Text {...styles.emptyStateTitle}>
            {t('lc.sessionsSupport.emptyState.title', 'No Session Found')}
          </Text>
          {/* <Text {...styles.emptyStateDescription}>
            {t('lc.sessionsSupport.emptyState.description', 'No Session Found')}
          </Text> */}
        </VStack>
      </Box>
    );
  }

  return (
    <VStack space="md" width="100%">
      {items.map((item, idx) => {
        const mentorName = item.mentor_name || item.session?.mentor_name || item.mentorName || '';
        const requestedDateStr = item.created_at || item.createdAt || item.requested_at
          ? moment(item.created_at || item.createdAt || item.requested_at).format('YYYY-MM-DD')
          : '';
        const descriptionText = item.description || item.agenda || item.session?.description || item.session?.notes || '';
        const statusStyle = getStatusBadgeStyles(item.status);
        const hasInfoRequests = Boolean(item.meta?.extra_information);
        // History items: same Completed badge (colors + icon) as the Training/Assets history cards
        const isCompleted = item.status === SESSION_STATUS_LABEL.COMPLETED;
        const completedColors = getStatusColors(SESSION_STATUS_LABEL.COMPLETED);

        return (
          <Box
            key={item.id || item._id || idx}
            {...styles.cardContainer}
          >
            <HStack {...styles.cardHeaderHStack}>
              <VStack {...styles.cardInfoVStack}>
                <Text {...styles.cardTitleText}>
                  {item.title}
                </Text>
                {mentorName ? (
                  <Text {...styles.cardMentorText}>
                    {mentorName}
                  </Text>
                ) : null}
                {requestedDateStr ? (
                  <Text {...styles.cardDateText}>
                    {t('supportProvider.supportRequests.labels.requestedDate', 'Requested')}: {requestedDateStr}
                  </Text>
                ) : null}
              </VStack>

              <HStack {...styles.cardBadgesHStack}>
                {hasInfoRequests ? (
                  <Badge {...styles.cardBadge} {...styles.infoRequestedBadge}>
                    <BadgeText {...styles.cardBadgeText} {...styles.infoRequestedBadgeText}>
                      {t('lc.sessionsSupport.requestDetails.infoRequestedBadge', 'Info requested')}
                    </BadgeText>
                  </Badge>
                ) : null}
                {isCompleted ? (
                  <Badge borderWidth={1} borderColor={completedColors.border} bg={completedColors.bg} borderRadius="$full" px="$2" py="$0.5">
                    <HStack space="xs" alignItems="center">
                      <LucideIcon name={completedColors.icon} size={11} color={completedColors.text} />
                      <BadgeText {...styles.cardBadgeText} color={completedColors.text}>
                        {SESSION_STATUS_LABEL.COMPLETED}
                      </BadgeText>
                    </HStack>
                  </Badge>
                ) : (
                  <Badge
                    {...styles.cardBadge}
                    borderColor={statusStyle.borderColor}
                    bg={statusStyle.bg}
                  >
                    <BadgeText
                      {...styles.cardBadgeText}
                      color={statusStyle.color}
                    >
                      {statusStyle.label}
                    </BadgeText>
                  </Badge>
                )}
              </HStack>
            </HStack>

            {descriptionText ? (
              <Box {...styles.cardDescriptionBox}>
                <Text {...styles.cardDescriptionText}>
                  {descriptionText}
                </Text>
              </Box>
            ) : null}

            <HStack {...styles.cardFooterHStack}>
              <Button
                variant={'outlineghost' as any}
                {...styles.viewDetailsButton}
                onPress={() => {
                  const requestId = item.id || item._id;
                  if (requestId) {
                    const isCompleted = (item.status || '').toLowerCase().includes('complete');
                    // @ts-ignore
                    navigation.navigate('request-details', { requestId, ...(isCompleted ? { statusOverride: item.status } : {}) });
                  }
                }}
              >
                <ButtonText {...(styles.viewDetailsButtonText as any)}>
                  {t('supportProvider.supportOfferings.cards.viewDetails')}
                </ButtonText>
              </Button>
            </HStack>
          </Box>
        );
      })}
      {isShowLoadMore && (
        <Box alignItems="center" mt="$4" width="100%">
          {!isLoadingMore ? (
            <Button onPress={onLoadMoreItems}>
              <ButtonText>
                {t('supportProvider.supportOfferings.buttonTexts.loadMoreSessions')}
              </ButtonText>
            </Button>
          ) : (
            <Spinner />
          )}
        </Box>
      )}
    </VStack>
  );
};

export default MyRequests;
