import React, { useState, useEffect } from "react";
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
  ButtonIcon,
  Spinner,
} from '@ui';
import moment from 'moment';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { completeTrainingSession, getSessionEnrolledParticipants } from '../../../../../services/SupportOfferingsServices/supportOfferingsService';
// import { uploadFiles } from '../../../../../project-player/services/projectPlayerService';
// import { openFilePicker } from '../../../../../project-player/components/Task/FileEvidence/file-picker';
import type { MaterialItem, TrainingSessionItem, ParticipantAttendanceItem } from '../../../../../types/supportOfferingsTypes';
import SessionCompleteModal from '../modals/SessionCompleteModal';
import openExternalLink from '@utils/openExternalLink';
import styles from '../../styles';
import { FORM_MODE, SESSION_STATUS, SESSION_STATUS_LABEL } from '@constants/SUPPORT_PROVIDER_CARDS';
import { useSessionStatus, useRequesterInfo } from '@hooks/useSessionStatus';
import { useSessionAttendance } from '@hooks/useSessionAttendance';
import { openDownload } from "@utils/helper";

const getDeliveryMode = (item: TrainingSessionItem): 'offline' | 'online' | 'hybrid' => {
  const rawMode = (
    (typeof item.delivery_mode === 'object' ? item.delivery_mode?.value : item.delivery_mode) ||
    ''
  ).toLowerCase();

  if (rawMode.includes('hybrid')) {
    return 'hybrid';
  }
  if (rawMode.includes('online') || rawMode.includes('virtual')) {
    return 'online';
  }
  return 'offline';
};

const getDeliveryBadge = (deliveryMode: 'offline' | 'online' | 'hybrid') => {
  if (deliveryMode === 'online') {
    return {
      label: 'Online',
      icon: 'Video',
      bg: '$blue50',
      border: '$blue200',
      color: '$blue600',
    };
  }
  if (deliveryMode === 'hybrid') {
    return {
      label: 'Hybrid',
      icon: 'MapPin',
      bg: '#FFFBEB',
      border: '#FDE68A',
      color: '$warningIconColor',
    };
  }
  return {
    label: 'Offline',
    icon: 'MapPin',
    bg: '#FFFBEB',
    border: '#FDE68A',
    color: '$warningIconColor',
  };
};

const getStatusColors = (status: string) => {
  switch (status) {
    case SESSION_STATUS_LABEL.DRAFT:
      return {
        bg: '$backgroundLight100',
        border: '$borderColor',
        text: '$textMuted',
        icon: 'FileText',
      };

    case SESSION_STATUS_LABEL.UPCOMING:
      return {
        bg: '$blue50',
        border: 'transparent',
        text: '$blue600',
        icon: '',
      };

    case SESSION_STATUS_LABEL.IN_PROGRESS:
      return {
        bg: '$observationTaskBg',
        border: '#fde68a',
        text: '$warningIconColor',
        icon: 'AlertCircle',
      };

    case SESSION_STATUS_LABEL.CANCELLED:
      return {
        bg: '$error50',
        border: '$red200',
        text: '$red600',
        icon: 'XCircle',
      };

    case SESSION_STATUS_LABEL.EXPIRED:
      return {
        bg: '$error50',
        border: '$red200',
        text: '$red600',
        icon: 'Clock',
      };

    case SESSION_STATUS_LABEL.COMPLETED:
    default:
      return {
        bg: '$success50',
        border: '#a7f3d0',
        text: '$success600',
        icon: 'CheckCircle',
      };
  }
};

const formatResourceName = (file: MaterialItem) => {
  if (file.size) {
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    return `${file.name} (${sizeStr})`;
  }
  const match = file.info?.match(/(\d+(?:\.\d+)?\s*(?:MB|KB|GB|B))/i);
  if (match && !file.name.includes(match[1])) {
    return `${file.name} (${match[1]})`;
  }
  return file.name || 'File';
};

// const uploadFile = async (file: any) => {
//   const entityId = `trainingSession-${Date.now()}`;

//   const uploaded = await uploadFiles(entityId, [
//     { ...file, size: file.size ?? 0 },
//   ]);

//   const url = uploaded?.data?.[0]?.url;

//   if (!url) {
//     throw new Error(`Failed to upload file: ${file.name}`);
//   }

//   const data = uploaded?.data?.[0];
//   const [f, s] = data?.type?.split('/') || [];

//   return {
//     name: data?.name,
//     link: data?.url,
//     sourcePath: data?.sourcePath,
//     type: s || f,
//     size: data?.size,
//   };
// };

// ---------- Card ----------

interface CardProps {
  item: TrainingSessionItem;
  getItemDetails?: (item: any) => void;
  provinces?: any[];
  sites?: any[];
  footer?: (item: any) => React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  item: initialItem,
  getItemDetails,
  provinces,
  sites,
  footer
}) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const navigation = useNavigation();

  const [item, setItem] = useState<TrainingSessionItem>(initialItem);
  const [files, setFiles] = useState<MaterialItem[] | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const deliveryMode = getDeliveryMode(item);
  const deliveryBadge = getDeliveryBadge(deliveryMode);

  const currentStatus = item.status.toUpperCase();
  const { statusTag: derivedStatusTag } = useSessionStatus(item);
  // Provider view: session time is over but attendance not yet confirmed in DB
  const isExpired =
    !footer &&
    derivedStatusTag === SESSION_STATUS_LABEL.COMPLETED &&
    currentStatus !== SESSION_STATUS.COMPLETED;
  const statusTag = isExpired ? SESSION_STATUS_LABEL.EXPIRED : derivedStatusTag;
  const statusColors = getStatusColors(statusTag);
  const { requesterName, requesterOrgName } = useRequesterInfo(item as any);

  const canCopy = !!item.can_be_copied && currentStatus !== SESSION_STATUS.DRAFT;

  // Helper to parse unix seconds, ms timestamp, ISO string to ms
  const parseToMs = (val: any): number | null => {
    if (!val) return null;
    const num = Number(val);
    if (!isNaN(num)) {
      return num < 10000000000 ? num * 1000 : num;
    }
    const ms = new Date(val).getTime();
    return isNaN(ms) ? null : ms;
  };

  const startMs = parseToMs(item.start_date);
  const endMs = parseToMs(item.end_date);

  // Date & Time display in 12-hour format, same as the form's time picker: "Fri, 20 Mar 2026, 01:15 PM"
  const displayDateTime = startMs
    ? moment(startMs).format('ddd, D MMM YYYY, hh:mm A')
    : '--';

  // Duration display matching Figma: "3 hours" (or "2 days 2 hours" when >= 24 hours)
  const displayDuration = (() => {
    if (startMs && endMs && endMs > startMs) {
      const diffMins = Math.round((endMs - startMs) / 60000);
      if (diffMins > 0) {
        const days = Math.floor(diffMins / 1440);
        const hours = Math.floor((diffMins % 1440) / 60);
        const mins = diffMins % 60;

        const parts: string[] = [];
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);

        return parts.join(' ');
      }
    }
    if ((item as any).duration) {
      const dur = (item as any).duration;
      return typeof dur === 'number' ? `${dur} hours` : dur;
    }
    return null;
  })();

  // Expected participants and confirmed present dynamically from seats_limit and seats_remaining
  const expectedParticipants = item.seats_limit || (item as any).max_participants || 0;
  const seatsRemaining = item.seats_remaining ?? expectedParticipants;
  const confirmedPresent = expectedParticipants > 0 ? Math.max(0, expectedParticipants - seatsRemaining) : 0;
  const hasAssignedParticipants = confirmedPresent > 0;
  // Session time is over (whether or not it was already marked complete)
  const hasEnded = !footer && derivedStatusTag === SESSION_STATUS_LABEL.COMPLETED;
  const { participants: enrolledParticipants, isLoading: isLoadingParticipants, ensureLoaded, applyPresent } =
    useSessionAttendance(item.id);
  // Counts come from the sessions list API; fall back to the assigned count when absent
  const enrolledCount = (item as any).enrolled_mentees_count ?? confirmedPresent;
  const presentCount = (item as any).present_mentees_count ?? 0;
  // Stays visible until at least one attendee is marked present
  const canConfirmAttendance = hasEnded && enrolledCount > 0 && presentCount <= 0;
  const spotsText = expectedParticipants > 0 ? ` (${seatsRemaining} spots)` : '';

  // Editing is only allowed for draft sessions, or upcoming sessions that have
  // no participants assigned yet.
  const canEditSession =
    currentStatus === SESSION_STATUS.DRAFT ||
    (statusTag === SESSION_STATUS_LABEL.UPCOMING && confirmedPresent <= 0);
  const participantsDisplay = `${confirmedPresent} / ${expectedParticipants} participants`;

  // Location & Link dynamically from meeting_info_details or meeting_info
  const locationValue =
    (item as any).meeting_info_details?.location ||
    item.meeting_info?.location ||
    '';
  const linkValue =
    (item as any).meeting_info_details?.link ||
    item.meeting_info?.link ||
    '';

  const provinceName = provinces?.find((e: any) => e._id === item.provinces?.[0] || e._id === item?.meta?.provinces?.[0])?.name || item.province || '';
  const locationName =
    locationValue ||
    item.hubOffice ||
    (item as any).hub_office ||
    item.site ||
    provinceName ||
    '-';

  const descriptionText = item.description || item.notes || '';

  const handleCopySession = () => {
    (navigation as any).navigate('form-training-session', { type: FORM_MODE.COPY, id: item.id });
  };

  const handleOpenCompleteModal = async () => {
    setIsCompleteModalOpen(true);
    await ensureLoaded();
  };

  /*
   * Keep participant ID based completion functionality.
   */
  const handleConfirmSessionComplete = async (
    selectedParticipantIds: string[]
  ) => {
    if (isCompleting) return;

    setIsCompleting(true);

    try {
      await completeTrainingSession(item.id, {
        mentees: selectedParticipantIds,
      });

      const hasMarkedAttendance = selectedParticipantIds.length > 0;

      // Keep the cached list in sync so reopening the modal shows the saved attendance
      applyPresent(selectedParticipantIds);

      setItem((prev) => {
        const prevLimit = prev.seats_limit || 0;
        return {
          ...prev,
          status: SESSION_STATUS.COMPLETED,
          present_mentees_count: selectedParticipantIds.length,
          seats_remaining: hasMarkedAttendance
            ? Math.max(0, prevLimit - selectedParticipantIds.length)
            : prev.seats_remaining,
          completionNotes:
            prev.completionNotes ||
            t(
              'supportProvider.supportOfferings.cards.alerts.sessionCompleted'
            ),
        };
      });

      setIsCompleteModalOpen(false);

      showAlert(
        'success',
        t(
          'supportProvider.supportOfferings.cards.alerts.sessionCompleted'
        )
      );
    } catch (error) {
      console.error('Error completing session via API:', error);

      showAlert(
        'error',
        'Failed to complete session. Please try again.'
      );
    } finally {
      setIsCompleting(false);
    }
  };

  /*
   * Upload functionality via uploadFiles API
   */

  useEffect(() => {
    setItem(initialItem);
    setFiles(initialItem?.materials || null);
  }, [initialItem]);

  return (
    <Box {...styles.cardContainer}>
      <VStack {...styles.cardFullVStack}>
        {/* ROW 1 - TITLE & BADGES */}
        <HStack {...(footer ? styles.supportRow1 : styles.headerTopHStack)}>
          <HStack {...styles.headerTitleBadgeHStack}>
            <Text {...styles.cardHeaderTitleText}>{item.title}</Text>

            <Badge {...styles.badgeContainer(statusColors.bg, statusColors.border)}>
              <HStack {...styles.badgeContentHStack}>
                {statusColors.icon ? (
                  <LucideIcon name={statusColors.icon} {...styles.badgeIconProps(statusColors.text)} />
                ) : null}
                <BadgeText {...styles.badgeText(statusColors.text)} {...(isExpired && { fontWeight: '$bold' })}>{statusTag}</BadgeText>
              </HStack>
            </Badge>
          </HStack>

          <Badge {...styles.deliveryBadgeContainer(deliveryBadge.bg, deliveryBadge.border)}>
            <HStack {...styles.badgeContentHStack}>
              <LucideIcon name={deliveryBadge.icon} {...styles.badgeIconProps(deliveryBadge.color)} />
              <BadgeText {...styles.deliveryBadgeText(deliveryBadge.color)}>{deliveryBadge.label}</BadgeText>
            </HStack>
          </Badge>
        </HStack>

        {/* ROW 2 - METADATA (single row: Date & Time, Duration, Location - matching Figma) */}
        <HStack {...styles.trainingMetaRowHStack}>
          {/* Date & Time */}
          <HStack space="xs" alignItems="center">
            <LucideIcon name="Calendar" {...styles.cardMetaIconProps} />
            <Text fontSize="$xs" color="$textPrimary" fontWeight="$semibold">
              {displayDateTime}
            </Text>
          </HStack>

          {/* Duration */}
          {displayDuration ? (
            <HStack space="xs" alignItems="center">
              <LucideIcon name="Clock" {...styles.cardMetaIconProps} />
              <Text fontSize="$xs" color="$textSecondary">
                {displayDuration}
              </Text>
            </HStack>
          ) : null}

          {/* Location / Venue */}
          <HStack space="xs" alignItems="center">
            <LucideIcon name="MapPin" {...styles.cardMetaIconProps} />
            <Text fontSize="$xs" color="$textSecondary">
              {locationName}
            </Text>
          </HStack>
          <HStack space="xs" alignItems="center">
            <LucideIcon name="Users" {...styles.cardMetaIconProps} />
            <Text fontSize="$xs" color="$textPrimary">
              {participantsDisplay}
            </Text>
          </HStack>
        </HStack>

        {/* ROW 3 - NOTES / DESCRIPTION (plain text, matching Figma) */}
        {descriptionText ? (
          <Text {...styles.trainingDescriptionText}>
            {descriptionText}
          </Text>
        ) : null}

        {/* ROW 4 - ACTIONS */}
        {footer ? (
          footer(item)
        ) : (
          <HStack {...styles.requestedByRowHStack}>
            {requesterName && (
              <Text {...styles.cardRequestedByText}>
                {t('supportProvider.supportOfferings.cards.requestedByPrefix', 'Requested by: ')}
                <Text fontWeight="$normal" color="$textPrimary" fontSize={'$xs'}>
                  {requesterName}
                </Text>
                {requesterOrgName ? ` (${requesterOrgName})` : ''}
              </Text>
            )}
            <HStack {...styles.badgeContentHStack}>
              {/* DRAFT, or UPCOMING with no participants assigned yet */}
              {canEditSession && (
                <Button
                  // @ts-ignore
                  variant="outlineghost" {...styles.outlineActionBtn} onPress={() => { (navigation as any).navigate('form-training-session', { id: item.id, type: FORM_MODE.EDIT, }); }}>
                  {/* @ts-ignore */}
                  <ButtonText {...styles.outlineActionBtnText}>{t('common.edit', 'Edit')}</ButtonText>
                </Button>
              )}
              {/* IN PROGRESS */}
              {currentStatus === SESSION_STATUS.LIVE || currentStatus === SESSION_STATUS_LABEL.IN_PROGRESS && (
                <Button variant="solid" {...styles.completeActionBtn} onPress={handleOpenCompleteModal} disabled={isCompleting}  >
                  <ButtonIcon as={LucideIcon} name="CheckCircle" {...styles.cardWhiteIconProps} />
                  {/* @ts-ignore */}
                  <ButtonText {...styles.completeActionBtnText}>
                    {t('supportProvider.supportOfferings.cards.complete', 'Complete')}
                  </ButtonText>
                </Button>
              )}
              {/* UPCOMING / COMPLETED */}
              {canCopy && (
                <Button variant="outline" {...styles.outlineActionBtn} onPress={handleCopySession}>
                  <ButtonIcon as={LucideIcon} name="Copy" {...styles.cardCopyIconProps} />
                  {/* @ts-ignore */}
                  <ButtonText {...styles.outlineActionBtnText}>
                    {t('supportProvider.supportOfferings.cards.copySession', 'Copy Session')}
                  </ButtonText>
                </Button>
              )}

              {canConfirmAttendance && (
                <Button variant={'outlineghost' as any}  {...styles.outlineActionBtn} onPress={handleOpenCompleteModal}  >
                  {/* @ts-ignore */}
                  <ButtonText {...styles.outlineActionBtnText}>
                    {t('supportProvider.supportOfferings.cards.confirmAttendance', 'Confirm Attendance')}
                  </ButtonText>
                </Button>
              )}

              <Button variant="solid" {...styles.detailsBtn}
                onPress={async () => {
                  if (!files) {
                    await getItemDetails?.(item)
                  } else {
                    setFiles(null);
                  }
                }}
              >
                {/* @ts-ignore */}
                <ButtonText {...styles.detailsBtnText}>
                  {!!files
                    ? t('supportProvider.supportOfferings.cards.hideDetails')
                    : t('supportProvider.supportOfferings.cards.viewDetails')}
                </ButtonText>
              </Button>
            </HStack >
          </HStack>
        )}

        {/* ACCORDION CONTENT */}
        {!footer && !!files && (
          <VStack {...styles.expandedContentVStack}>
            {/* LOCATION / LINK */}
            <VStack {...styles.sectionVStack}>
              <Text {...styles.cardSectionTitleText}>
                {deliveryMode === 'online'
                  ? t('supportProvider.supportOfferings.cards.link', 'Link')
                  : t('supportProvider.supportOfferings.cards.location', 'Location')}
              </Text>

              {(deliveryMode === 'online' || deliveryMode === 'hybrid') && (
                <Pressable onPress={(e) => { e?.stopPropagation?.(); if (linkValue) openExternalLink(linkValue); }}  >
                  <HStack {...styles.virtualLinkHStack}>
                    <LucideIcon name="Video" {...styles.cardPrimaryIconProps} />
                    <Text {...styles.cardPrimaryLinkText}>{linkValue || '-'}</Text>
                  </HStack>
                </Pressable>
              )}

              {(deliveryMode === 'offline' || deliveryMode === 'hybrid') && (
                <HStack {...styles.virtualLinkHStack}>
                  <LucideIcon name="MapPin" {...styles.cardMetaIconProps} />
                  <Text {...styles.cardLocationValueText}>{locationValue || '-'}</Text>
                </HStack>
              )}
            </VStack>

            {/* ATTENDANCE */}
            <VStack {...styles.sectionVStack}>
              <HStack justifyContent="space-between" alignItems="center" width="100%">
                <Text {...styles.cardSectionTitleText}>
                  {t('supportProvider.supportOfferings.cards.attendance', 'Attendance')}
                </Text>

                {canConfirmAttendance && (
                  <Button variant="solid"  {...styles.confirmAttendanceBtn} onPress={handleOpenCompleteModal}  >
                    <ButtonIcon as={LucideIcon} name="Check" {...styles.cardWhiteIconProps} />
                    <ButtonText {...(styles.confirmAttendanceBtnText as any)}>
                      {t('supportProvider.supportOfferings.cards.confirmAttendance', 'Confirm Attendance')}
                    </ButtonText>
                  </Button>
                )}
              </HStack>

              <Box {...styles.attendanceBox}>
                <HStack {...styles.attendanceRowHStack}>
                  <VStack {...styles.attendanceItemVStack}>
                    <Text {...styles.attendanceLabelText}>
                      {t('supportProvider.supportOfferings.cards.expectedParticipants', 'Expected Participants')}
                    </Text>
                    <Text {...styles.cardValueBoldText}>{enrolledCount}</Text>
                  </VStack>

                  <VStack {...styles.attendanceItemVStack}>
                    <Text {...styles.attendanceLabelText}>
                      {t('supportProvider.supportOfferings.cards.confirmedPresent', 'Confirmed Present')}
                    </Text>

                    {presentCount > 0 ? (
                      <HStack {...styles.badgeContentHStack}>
                        <Text {...styles.cardSuccessBoldText}>{presentCount}</Text>
                        <LucideIcon name="CheckCircle" {...styles.cardSuccessIconProps} />
                      </HStack>
                    ) : (
                      <Text {...styles.cardMetaSmText}>
                        {t('supportProvider.supportOfferings.cards.notConfirmed', 'Not Confirmed')}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Box>
            </VStack>

            {/* SESSION MATERIALS */}
            {(currentStatus !== SESSION_STATUS.COMPLETED || files?.length > 0) && (
              <VStack {...styles.sectionVStack}>
                <HStack {...styles.materialsHeaderHStack}>
                  <Text {...styles.cardSectionTitleText}>
                    {t('supportProvider.supportOfferings.cards.sessionMaterials', 'Session Materials')}
                  </Text>

                  {/* {currentStatus !== 'COMPLETED' && (
                    <Pressable {...styles.uploadMaterialBtn} onPress={handleUploadPress}>
                      <HStack {...styles.badgeContentHStack}>
                        <LucideIcon name="Upload" {...styles.cardMetaIconProps} />
                        <Text {...styles.cardMetaText} fontWeight="$bold">
                          {t('supportProvider.supportOfferings.cards.uploadMaterial', 'Upload Material')}
                        </Text>
                      </HStack>
                    </Pressable>
                  )} */}
                </HStack>

                {files?.length > 0 && (
                  <VStack {...styles.filesListVStack}>
                    {files?.map((file, idx) => (
                      <Box key={idx} {...styles.resourceCard}>
                        <HStack {...styles.fileCardOuterHStack}>
                          <HStack {...styles.fileCardInnerHStack}>
                            <LucideIcon name="FileText" {...styles.cardFileTextIconProps} />
                            <Text {...styles.resourceFileNameText} numberOfLines={1} ellipsizeMode="tail">
                              {formatResourceName(file)}
                            </Text>
                          </HStack>

                          <Pressable onPress={() => openDownload(file?.link || "")}  {...styles.iconPressablePadding}>
                            <HStack {...styles.badgeContentHStack}>
                              <LucideIcon name="Download" {...styles.cardPrimaryIconProps} />
                              <Text {...styles.downloadLinkText}>{t('common.download', 'Download')}</Text>
                            </HStack>
                          </Pressable>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            )}
          </VStack>
        )
        }
      </VStack >

      {/* SESSION COMPLETE MODAL */}
      < SessionCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        sessionTitle={item.title}
        expectedParticipantsCount={expectedParticipants}
        initialParticipants={enrolledParticipants ?? undefined}
        isLoadingParticipants={isLoadingParticipants}
        onConfirmComplete={handleConfirmSessionComplete}
      />
    </Box >
  );
};

// ---------- ListCard ----------

export interface TrainingCardProps {
  items: TrainingSessionItem[];
  isShowLoadMore?: boolean;
  onLoadMoreItems?: () => void;
  isLoadingMore?: boolean;
  _card?: any
}

export default function TrainingCard({
  items = [],
  isShowLoadMore,
  onLoadMoreItems,
  isLoadingMore = false,
  _card
}: TrainingCardProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <VStack {...styles.listContainer}>
      {items.map((item) => (
        <Card key={item.id} {..._card} item={item} />
      ))}
      {isShowLoadMore && (
        <Box alignItems="center" mt="$4" width="100%">
          {!isLoadingMore ? (
            <Button onPress={onLoadMoreItems}>
              <ButtonText>
                {t('supportProvider.supportOfferings.buttonTexts.loadMoreSessions', 'Load More Sessions')}
              </ButtonText>
            </Button>
          ) : (
            <Spinner />
          )}
        </Box>
      )}
    </VStack>
  );
}
