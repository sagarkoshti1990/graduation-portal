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
// Request-based flow disabled: LCs now enroll participants directly into the asset session
// import {
//   getSupportRequests,
//   declineSupportRequest,
//   acceptAndScheduleSupportRequest,
//   SupportRequestItem,
// } from '../../../../../services/serviceProvider/serviceProviderService';
import { getParticipantProfile } from '../../../../../services/participantService';
import { getEnrolledMentees } from '../../../../../services/mentoringService';
import { completeTrainingSession } from '../../../../../services/SupportOfferingsServices/supportOfferingsService';
import { removeMenteesFromSession } from '../../../../../services/SessionSupportServices/sessionRequestorService';
import type { AssetItem } from '../../../../../types/supportOfferingsTypes';
import DeclineModal from '../../../SupportRequests/components/modals/DeclineModal';
import styles from '../../styles';

const BASE_PATH = 'supportProvider.supportOfferings.assetRequestsModal';

interface AssetRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetItem | null;
}

interface EnrolledParticipant {
  id: string;
  name: string;
  coachId: string;
  enrolledDate: string;
  isApproved: boolean;
}

interface CoachGroup {
  coachId: string;
  items: EnrolledParticipant[];
}

export default function AssetRequestsModal({
  isOpen,
  onClose,
  asset,
}: AssetRequestsModalProps): React.JSX.Element | null {
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<EnrolledParticipant[]>([]);
  const [isDeclineAllOpen, setIsDeclineAllOpen] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [coachNamesById, setCoachNamesById] = useState<Record<string, string>>({});

  // Coach (LC) names are resolved from the enrolling user's id and cached across opens
  const profileCacheRef = useRef<Record<string, string>>({});

  const fetchCoachNames = async (list: EnrolledParticipant[]) => {
    const uniqueIds = Array.from(new Set(list.map((item) => item.coachId).filter(Boolean)))
      .filter((id) => !profileCacheRef.current[id]);

    if (uniqueIds.length > 0) {
      const results = await Promise.allSettled(
        uniqueIds.map(async (id) => ({ id, profile: await getParticipantProfile(id) })),
      );
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.profile?.name) {
          profileCacheRef.current[r.value.id] = r.value.profile.name;
        }
      });
    }
    setCoachNamesById({ ...profileCacheRef.current });
  };

  // Participants enrolled into this asset by LCs; a participant is "approved" once their attendance is marked
  const fetchRequests = useCallback(async () => {
    if (!asset?.id) return;
    setIsLoading(true);
    try {
      const mentees = await getEnrolledMentees(asset.id);
      const list: EnrolledParticipant[] = (mentees || []).map((mentee: any) => ({
        id: String(mentee.id),
        name: mentee.name || String(mentee.id),
        coachId: mentee.enrolled_by ? String(mentee.enrolled_by) : '',
        enrolledDate: mentee.enrolled_at ? moment(mentee.enrolled_at).format('YYYY/MM/DD') : '-',
        isApproved: !!mentee.joined_at,
      }));
      setItems(list);
      fetchCoachNames(list);
    } catch (error) {
      showAlert('error', t(`${BASE_PATH}.fetchFailed`, 'Failed to load asset requests. Please try again.'));
    } finally {
      setIsLoading(false);
    }
    // showAlert/t are recreated every render by their contexts - keeping them out of the
    // dependency list avoids re-triggering the effect below on every render (which was
    // hammering the API into 429s).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id]);

  useEffect(() => {
    if (isOpen) fetchRequests();
  }, [isOpen, fetchRequests]);

  const groups = useMemo<CoachGroup[]>(() => {
    const map = new Map<string, CoachGroup>();
    items.forEach((item) => {
      const key = item.coachId || '-';
      if (!map.has(key)) map.set(key, { coachId: key, items: [] });
      map.get(key)!.items.push(item);
    });
    return Array.from(map.values());
  }, [items]);

  const pendingIds = useMemo(() => items.filter((item) => !item.isApproved).map((item) => item.id), [items]);

  // Decline removes the pending participants from the asset so their seats free up
  const handleDeclineAllSubmit = async (_reason: string, _details: string) => {
    try {
      await removeMenteesFromSession(asset!.id, pendingIds);
      showAlert('success', t(`${BASE_PATH}.allDeclined`, 'All requests declined successfully.'));
      await fetchRequests();
      onClose();
    } catch (error) {
      showAlert('error', t(`${BASE_PATH}.declineFailed`, 'Failed to decline request(s). Please try again.'));
    } finally {
      setIsDeclineAllOpen(false);
    }
  };

  // Approve marks attendance for the pending participants, same as Confirm Attendance on a training
  const handleApproveAll = async () => {
    if (pendingIds.length === 0) return;
    setIsApprovingAll(true);
    try {
      await completeTrainingSession(asset!.id, { mentees: pendingIds });
      showAlert('success', t(`${BASE_PATH}.allApproved`, 'All requests approved successfully.'));
      await fetchRequests();
      onClose();
    } catch (error) {
      showAlert('error', t(`${BASE_PATH}.approveFailed`, 'Failed to approve request(s). Please try again.'));
    } finally {
      setIsApprovingAll(false);
    }
  };

  /* Request-based handlers disabled: LCs now enroll participants directly into the asset session
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
  */

  if (!asset) return null;

  const isActionDisabled = pendingIds.length === 0 || isLoading || isApprovingAll;

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
                disabled={isActionDisabled}
                opacity={isActionDisabled ? 0.5 : 1}
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
                disabled={isActionDisabled}
                opacity={isActionDisabled ? 0.5 : 1}
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
              <Box key={group.coachId} borderWidth={1} borderColor="$borderColor" borderRadius="$lg" overflow="hidden">
                <HStack bg="$backgroundMuted" px="$4" py="$3" justifyContent="space-between" alignItems="center">
                  <HStack space="xs" alignItems="center" flexWrap="wrap">
                    <Text fontWeight="$bold" fontSize="$sm" color="$textPrimary">
                      {t(`${BASE_PATH}.coachLabel`, {
                        defaultValue: 'Coach: {{name}}',
                        name: coachNamesById[group.coachId] || group.coachId,
                      })}
                    </Text>
                  </HStack>
                  <Badge bg="$white" borderWidth={1} borderColor="$borderColor" borderRadius="$full" px="$2.5" py="$0.5">
                    <BadgeText fontSize="$xs" color="$textPrimary">
                      {t(`${BASE_PATH}.participantsCount`, {
                        defaultValue: '{{count}} participant(s)',
                        count: group.items.length,
                      })}
                    </BadgeText>
                  </Badge>
                </HStack>

                <VStack>
                  {group.items.map((item) => (
                    <HStack
                      key={item.id}
                      px="$4"
                      py="$2.5"
                      justifyContent="space-between"
                      alignItems="center"
                      borderTopWidth={1}
                      borderTopColor="$borderColor"
                    >
                      <VStack space="xs">
                        <Text fontWeight="$semibold" fontSize="$xs" color="$textPrimary">
                          {item.name}
                        </Text>
                        <Text fontSize="$2xs" color="$textMuted">
                          {t(`${BASE_PATH}.requestedOn`, { defaultValue: 'Requested: {{date}}', date: item.enrolledDate })}
                        </Text>
                      </VStack>

                      {item.isApproved ? (
                        <Badge bg="$success50" borderColor="#a7f3d0" borderWidth={1} borderRadius="$full" px="$2" py="$0.5">
                          <BadgeText color="$success600" fontSize="$2xs">
                            {t(`${BASE_PATH}.approved`, 'Approved')}
                          </BadgeText>
                        </Badge>
                      ) : (
                        <Badge bg="$observationTaskBg" borderColor="#fde68a" borderWidth={1} borderRadius="$full" px="$2" py="$0.5">
                          <BadgeText color="$warningIconColor" fontSize="$2xs">
                            {t(`${BASE_PATH}.pendingApproval`, 'Pending Approval')}
                          </BadgeText>
                        </Badge>
                      )}
                    </HStack>
                  ))}
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
