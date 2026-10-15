import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import moment from 'moment';
import Modal from '@components/ui/Modal';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  BadgeText,
  Button,
  ButtonText,
  ButtonIcon,
  LucideIcon,
  useAlert,
} from '@ui';
import { theme } from '@config/theme';
import { useLanguage } from '@contexts/LanguageContext';
import {
  getSupportRequests,
  declineSupportRequest,
  acceptAndScheduleSupportRequest,
  SupportRequestItem,
} from '../../../../../services/serviceProvider/serviceProviderService';
import { getParticipantProfile } from '../../../../../services/participantService';
import type { AssetItem } from '../../../../../types/supportOfferingsTypes';
import DeclineModal from '../../../SupportRequests/components/modals/DeclineModal';
import styles from '../../styles';

const BASE_PATH = 'supportProvider.supportOfferings.assetRequestsModal';

interface AssetRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetItem | null;
}

interface CoachGroup {
  coach: string;
  hub?: string;
  items: SupportRequestItem[];
}

export default function AssetRequestsModal({
  isOpen,
  onClose,
  asset,
}: AssetRequestsModalProps): React.JSX.Element | null {
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<SupportRequestItem[]>([]);
  const [isDeclineAllOpen, setIsDeclineAllOpen] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [requesteeNamesByItemId, setRequesteeNamesByItemId] = useState<Record<string, string[]>>({});

  // `requestees` on the raw list item is just an array of participant user ids (no names) - resolve
  // each id to a display name via the same per-user profile lookup the rest of the app uses, and
  // cache results across items/coaches since the same participant can appear in multiple requests.
  const profileCacheRef = useRef<Record<string, string>>({});

  const fetchRequesteeNames = async (list: SupportRequestItem[]) => {
    const idsByItem: Record<string, string[]> = {};
    const uniqueIds = new Set<string>();
    list.forEach((item) => {
      const ids: string[] = Array.isArray(item.raw?.requestees) ? item.raw.requestees.map(String) : [];
      idsByItem[String(item.id)] = ids;
      ids.forEach((id) => {
        if (!profileCacheRef.current[id]) uniqueIds.add(id);
      });
    });

    if (uniqueIds.size > 0) {
      const results = await Promise.allSettled(
        Array.from(uniqueIds).map(async (id) => ({ id, profile: await getParticipantProfile(id) })),
      );
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.profile?.name) {
          profileCacheRef.current[r.value.id] = r.value.profile.name;
        }
      });
    }

    const namesById: Record<string, string[]> = {};
    Object.entries(idsByItem).forEach(([itemId, ids]) => {
      const names = ids.map((id) => profileCacheRef.current[id]).filter(Boolean) as string[];
      if (names.length > 0) namesById[itemId] = names;
    });
    if (Object.keys(namesById).length > 0) {
      setRequesteeNamesByItemId((prev) => ({ ...prev, ...namesById }));
    }
  };

  const fetchRequests = useCallback(async () => {
    if (!asset) return;
    setIsLoading(true);
    try {
      const res = await getSupportRequests({ tab: 'assets' });
      const list = res?.data || [];
      // /requestSessions/list isn't scoped to a single asset offering, so requests for this
      // card are matched by title - the only field shared between AssetItem and SupportRequestItem.
      const filtered = list.filter((r) => (r.title || '').trim() === (asset.title || '').trim());
      setItems(filtered);
      setRequesteeNamesByItemId({});
      fetchRequesteeNames(filtered);
    } catch (error) {
      showAlert('error', t(`${BASE_PATH}.fetchFailed`, 'Failed to load asset requests. Please try again.'));
    } finally {
      setIsLoading(false);
    }
    // showAlert/t are recreated every render by their contexts - keeping them out of the
    // dependency list avoids re-triggering the effect below on every render (which was
    // hammering the API into 429s).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.title]);

  useEffect(() => {
    if (isOpen) fetchRequests();
  }, [isOpen, fetchRequests]);

  const groups = useMemo<CoachGroup[]>(() => {
    const map = new Map<string, CoachGroup>();
    items.forEach((item) => {
      const key = item.coach || '-';
      if (!map.has(key)) map.set(key, { coach: item.coach, hub: item.hub, items: [] });
      map.get(key)!.items.push(item);
    });
    return Array.from(map.values());
  }, [items]);

  const handleDeclineAllSubmit = async (reason: string, details: string) => {
    try {
      await Promise.all(
        items.map((item) => declineSupportRequest({ requestId: item.id, reason, details })),
      );
      showAlert('success', t(`${BASE_PATH}.allDeclined`, 'All requests declined successfully.'));
      await fetchRequests();
      onClose();
    } catch (error) {
      showAlert('error', t(`${BASE_PATH}.declineFailed`, 'Failed to decline request(s). Please try again.'));
    } finally {
      setIsDeclineAllOpen(false);
    }
  };

  // "Approve All" has no per-request review step, so it can't collect real schedule details -
  // fill the accept API's required fields with sensible defaults derived from the asset/request
  // itself (today's date, a 2-hour window, the request's own province/site/category).
  const buildSilentApprovePayload = (item: SupportRequestItem) => {
    const now = moment();
    const province = item.raw?.meta?.provinces?.[0] || item.raw?.meta?.province || item.raw?.provinces?.[0] || '';
    const sites: string[] = Array.isArray(item.raw?.meta?.sites)
      ? item.raw.meta.sites
      : (item.raw?.meta?.site ? [item.raw.meta.site] : (Array.isArray(item.raw?.sites) ? item.raw.sites : []));
    const category = item.raw?.categories?.[0] || item.raw?.category || '';

    return {
      requestId: item.id,
      support_offering_type: 'asset' as const,
      province,
      sites,
      category,
      title: item.title || '',
      description: item.raw?.description || item.justification || '',
      date: now.format('YYYY-MM-DD'),
      time: now.format('HH:mm'),
      duration: '2_hours',
      delivery_mode: item.raw?.delivery_mode || 'offline',
      capacity: String(item.participants || 1),
      location: (item.location && item.location !== '-') ? item.location : (item.raw?.location || ''),
      meetingLink: '',
      notes: '',
    };
  };

  const handleApproveAll = async () => {
    if (items.length === 0) return;
    setIsApprovingAll(true);
    try {
      const results = await Promise.allSettled(
        items.map((item) => acceptAndScheduleSupportRequest(buildSilentApprovePayload(item))),
      );
      const failedCount = results.filter(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success),
      ).length;

      if (failedCount === 0) {
        showAlert('success', t(`${BASE_PATH}.allApproved`, 'All requests approved successfully.'));
      } else if (failedCount < items.length) {
        showAlert(
          'info',
          t(`${BASE_PATH}.someApproveFailed`, {
            defaultValue: '{{failed}} of {{total}} requests could not be approved.',
            failed: failedCount,
            total: items.length,
          }),
        );
      } else {
        showAlert('error', t(`${BASE_PATH}.approveFailed`, 'Failed to approve request(s). Please try again.'));
      }
      await fetchRequests();
      if (failedCount === 0) onClose();
    } finally {
      setIsApprovingAll(false);
    }
  };

  if (!asset) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        headerContent={
          <VStack space="xs" flex={1}>
            <HStack alignItems="center" space="sm">
              {asset.type ? (
                <Badge {...styles.inKindBadgeContainer}>
                  <BadgeText {...styles.inKindBadgeText}>{asset.type}</BadgeText>
                </Badge>
              ) : null}
              <Text fontSize="$lg" fontWeight="$bold" color="$textPrimary">
                {t(`${BASE_PATH}.title`, 'Asset Requests')}
              </Text>
            </HStack>
            <Text fontSize="$md" fontWeight="$semibold" color="$textPrimary">
              {asset.title}
            </Text>
            <HStack space="xs" alignItems="center">
              {asset.value ? (
                <Text fontSize="$sm" color="$textSecondary">
                  {`${asset.value} / ${t(`${BASE_PATH}.participant`, 'participant')}`}
                </Text>
              ) : null}
              {asset.quantity !== undefined ? (
                <>
                  {asset.value ? <Text color="$textMuted">•</Text> : null}
                  <Text fontSize="$sm" color="$textSecondary">
                    {t(`${BASE_PATH}.totalAvailable`, { defaultValue: 'Total Available Quantity: {{count}}', count: asset.quantity })}
                  </Text>
                </>
              ) : null}
            </HStack>
          </VStack>
        }
        cancelButtonText={t('common.close', 'Close')}
      >
        <VStack space="md">
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$sm" fontWeight="$semibold" color="$textPrimary">
              {t(`${BASE_PATH}.groupedByCoach`, 'Requests grouped by Coach (LC)')}
            </Text>
            <HStack space="sm">
              <Button
                size="xs"
                variant="solid"
                bg="$success600"
                $hover-bg="$success600"
                onPress={handleApproveAll}
                disabled={items.length === 0 || isLoading || isApprovingAll}
                opacity={items.length === 0 || isLoading || isApprovingAll ? 0.5 : 1}
              >
                <ButtonIcon as={LucideIcon} name="Check" size={12} color={theme.tokens.colors.modalBackground} />
                <ButtonText fontSize="$xs" color="$white" ml="$1">
                  {t(`${BASE_PATH}.approveAll`, 'Approve All')}
                </ButtonText>
              </Button>
              <Button
                size="xs"
                // @ts-ignore
                variant="outlineghost"
                onPress={() => setIsDeclineAllOpen(true)}
                disabled={items.length === 0 || isLoading || isApprovingAll}
                opacity={items.length === 0 || isLoading || isApprovingAll ? 0.5 : 1}
              >
                <ButtonIcon as={LucideIcon} name="X" size={12} color={theme.tokens.colors.error600} />
                <ButtonText fontSize="$xs" color="$error600" ml="$1">
                  {t(`${BASE_PATH}.declineAll`, 'Decline All')}
                </ButtonText>
              </Button>
            </HStack>
          </HStack>

          {isLoading ? (
            <Box py="$8" alignItems="center">
              <ActivityIndicator size="large" color={theme.tokens.colors.primary500} />
            </Box>
          ) : groups.length === 0 ? (
            <Box py="$8" alignItems="center">
              <Text color="$textMuted" fontSize="$sm">
                {t(`${BASE_PATH}.empty`, 'No pending requests for this asset.')}
              </Text>
            </Box>
          ) : (
            groups.map((group) => (
              <Box key={group.coach} borderWidth={1} borderColor="$borderColor" borderRadius="$lg" overflow="hidden">
                <HStack bg="$backgroundMuted" px="$4" py="$3" justifyContent="space-between" alignItems="center">
                  <HStack space="xs" alignItems="center" flexWrap="wrap">
                    <Text fontWeight="$bold" fontSize="$sm" color="$textPrimary">
                      {t(`${BASE_PATH}.coachLabel`, { defaultValue: 'Coach: {{name}}', name: group.coach })}
                    </Text>
                    {group.hub && group.hub !== '-' ? (
                      <>
                        <Text color="$textMuted">•</Text>
                        <Text fontSize="$sm" color="$textSecondary">
                          {group.hub}
                        </Text>
                      </>
                    ) : null}
                  </HStack>
                  <Badge bg="$white" borderWidth={1} borderColor="$borderColor" borderRadius="$full" px="$2.5" py="$0.5">
                    <BadgeText fontSize="$xs" color="$textPrimary">
                      {t(`${BASE_PATH}.participantsCount`, {
                        defaultValue: '{{count}} participant(s)',
                        count: group.items.reduce((sum, i) => sum + (i.participants || 0), 0),
                      })}
                    </BadgeText>
                  </Badge>
                </HStack>

                <VStack>
                  {group.items.map((item) => {
                    const names = requesteeNamesByItemId[String(item.id)];
                    // One request record can bundle several requestees - show each by name when
                    // resolved, falling back to a single count row when names aren't available yet.
                    const rows = names?.length ? names : [null];

                    return (
                      <VStack key={item.id} borderTopWidth={1} borderTopColor="$borderColor">
                        {rows.map((name, idx) => (
                          <HStack
                            key={name || idx}
                            px="$4"
                            py="$2.5"
                            justifyContent="space-between"
                            alignItems="center"
                            borderTopWidth={idx > 0 ? 1 : 0}
                            borderTopColor="$borderColor"
                          >
                            <VStack space="xs">
                              <Text fontWeight="$semibold" fontSize="$xs" color="$textPrimary">
                                {name || t(`${BASE_PATH}.participantsCount`, { defaultValue: '{{count}} participant(s)', count: item.participants || 1 })}
                              </Text>
                              <Text fontSize="$2xs" color="$textMuted">
                                {t(`${BASE_PATH}.requestedOn`, { defaultValue: 'Requested: {{date}}', date: item.requestedDate })}
                              </Text>
                            </VStack>

                            <Badge bg="$observationTaskBg" borderColor="#fde68a" borderWidth={1} borderRadius="$full" px="$2" py="$0.5">
                              <BadgeText color="$warningIconColor" fontSize="$2xs">
                                {t(`${BASE_PATH}.pendingApproval`, 'Pending Approval')}
                              </BadgeText>
                            </Badge>
                          </HStack>
                        ))}
                      </VStack>
                    );
                  })}
                </VStack>
              </Box>
            ))
          )}
        </VStack>
      </Modal>

      <DeclineModal
        isOpen={isDeclineAllOpen}
        onClose={() => setIsDeclineAllOpen(false)}
        item={{ title: asset.title, coach: t(`${BASE_PATH}.allCoaches`, { defaultValue: '{{count}} coach(es)', count: groups.length }) }}
        onSubmit={handleDeclineAllSubmit}
      />
    </>
  );
}
