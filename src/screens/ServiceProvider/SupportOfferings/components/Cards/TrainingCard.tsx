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
import { completeTrainingSession } from '../../../../../services/SupportOfferingsServices/supportOfferingsService';
import { uploadFiles } from '../../../../../project-player/services/projectPlayerService';
import { openFilePicker } from '../../../../../project-player/components/Task/FileEvidence/file-picker';
import type { MaterialItem, TrainingSessionItem } from '../../../../../types/supportOfferingsTypes';
import SessionCompleteModal from '../modals/SessionCompleteModal';
import openExternalLink from '@utils/openExternalLink';
import styles from '../../styles';
import { FORM_MODE } from '@constants/SUPPORT_PROVIDER_CARDS';

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
      bg: '$purple50',
      border: '$purple200',
      color: '$purple600',
    };
  }
  return {
    label: 'Offline',
    icon: 'MapPin',
    bg: '$observationTaskBg',
    border: '#fde68a',
    color: '$warningIconColor',
  };
};

const getStatusColors = (status: string) => {
  status = status.toUpperCase();
  switch (status) {
    case 'DRAFT':
      return {
        bg: '$backgroundLight100',
        border: '$borderColor',
        text: '$textMuted',
        icon: 'FileText',
      };

    case 'UPCOMING':
      return {
        bg: '$blue50',
        border: '$blue200',
        text: '$blue600',
        icon: 'Clock',
      };

    case 'LIVE':
      return {
        bg: '$observationTaskBg',
        border: '#fde68a',
        text: '$warningIconColor',
        icon: 'AlertCircle',
      };

    case 'COMPLETED':
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

const uploadFile = async (file: any) => {
  const entityId = `trainingSession-${Date.now()}`;

  const uploaded = await uploadFiles(entityId, [
    { ...file, size: file.size ?? 0 },
  ]);

  const url = uploaded?.data?.[0]?.url;

  if (!url) {
    throw new Error(`Failed to upload file: ${file.name}`);
  }

  const data = uploaded?.data?.[0];
  const [f, s] = data?.type?.split('/') || [];

  return {
    name: data?.name,
    link: data?.url,
    sourcePath: data?.sourcePath,
    type: s || f,
    size: data?.size,
  };
};

// ---------- Card ----------

interface CardProps {
  item: TrainingSessionItem;
  footer?: (item: any) => React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  item: initialItem,
  footer
}) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const navigation = useNavigation();

  const [item, setItem] = useState<TrainingSessionItem>(initialItem);
  const [isExpanded, setIsExpanded] = useState(false);
  const [files, setFiles] = useState<MaterialItem[]>(initialItem.materials || []);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAttendanceConfirmed, setIsAttendanceConfirmed] = useState<boolean>(() => {
    const raw = initialItem as any;
    if (raw.is_attendance_confirmed || raw.attendance_confirmed) return true;
    const initialExpected = initialItem.seats_limit || 0;
    const initialRemaining = initialItem.seats_remaining;
    if (
      (initialItem.status === 'Completed' || initialItem.status === 'COMPLETED') &&
      initialRemaining !== undefined &&
      initialExpected - initialRemaining > 0
    ) {
      return true;
    }
    return false;
  });

  const displayDate = item.start_date
    ? moment(
      typeof item.start_date === 'number' || !isNaN(Number(item.start_date))
        ? Number(item.start_date) * 1000
        : item.start_date
    ).format('ddd, D MMM YYYY')
    : '--';

  const displayTime =
    item.start_date && item.end_date
      ? `${moment(
        typeof item.start_date === 'number' || !isNaN(Number(item.start_date))
          ? Number(item.start_date) * 1000
          : item.start_date
      ).format('HH:mm')} - ${moment(
        typeof item.end_date === 'number' || !isNaN(Number(item.end_date))
          ? Number(item.end_date) * 1000
          : item.end_date
      ).format('HH:mm')}`
      : '';

  const dateTime = displayTime ? `${displayDate}, ${displayTime}` : displayDate;

  const deliveryMode = getDeliveryMode(item);
  const deliveryBadge = getDeliveryBadge(deliveryMode);

  const formatStatus = () => {
    const thisStatus = item.status.toUpperCase();
    if (thisStatus === 'DRAFT') {
      return 'Draft';
    }

    if (thisStatus === 'COMPLETED') {
      return 'Completed';
    }

    if (item.start_date) {
      const startMs =
        typeof item.start_date === 'number' ||
          !isNaN(Number(item.start_date))
          ? Number(item.start_date) * 1000
          : new Date(item.start_date).getTime();

      const endMs = item.end_date
        ? (typeof item.end_date === 'number' || !isNaN(Number(item.end_date))
          ? Number(item.end_date) * 1000
          : new Date(item.end_date).getTime())
        : undefined;

      const nowMs = Date.now();

      if (endMs !== undefined && nowMs > endMs) {
        return 'Completed';
      }

      if (nowMs < startMs) {
        return 'Upcoming';
      }

      return 'In Progress';
    }

    return item.status || 'Upcoming';
  };
  const currentStatus = item.status.toUpperCase();
  const statusTag = formatStatus();
  const statusColors = getStatusColors(item.status);

  const canCopy = !!item.can_be_copied;

  // Expected participants and confirmed present dynamically from seats_limit and seats_remaining
  const expectedParticipants = item.seats_limit || 0;
  const confirmedPresent =
    (item.seats_limit || 0) - (item.seats_remaining || 0);
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

  const orgName =
    (typeof item.organization === 'object'
      ? item.organization?.name || item.organization?.organization_code
      : item.organization) ||
    item.organization_code ||
    '';
  const provinceName = (item.provinces && item.provinces[0]) || '';
  const descriptionText = item.description || item.notes || '';

  const handleCopySession = () => {
    (navigation as any).navigate('form-training-session', { type: FORM_MODE.COPY, id: item.id });
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
      setIsAttendanceConfirmed(hasMarkedAttendance);

      setItem((prev) => {
        const prevLimit = prev.seats_limit || 0;
        return {
          ...prev,
          status: 'Completed',
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
  const handleUploadPress = async () => {
    try {
      const selectedFiles = await openFilePicker({
        allowMultiSelection: true,
        type: [
          'application/pdf',
          'image/*',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      });

      if (!selectedFiles || selectedFiles.length === 0) return;

      const uploadPromises = selectedFiles.map((file) => uploadFile(file));
      const uploadedResults = await Promise.all(uploadPromises);

      setFiles((prev) => [...prev, ...uploadedResults]);

      showAlert(
        'success',
        t(
          'supportProvider.supportOfferings.cards.alerts.materialUploaded'
        )
      );
    } catch (err: any) {
      console.error('Error uploading material:', err);
      showAlert(
        'error',
        err?.message || 'Failed to upload file. Please try again.'
      );
    }
  };

  useEffect(() => {
    setItem(initialItem);
    setFiles(initialItem.materials || []);
    const raw = initialItem as any;
    const isConf =
      !!raw.is_attendance_confirmed ||
      !!raw.attendance_confirmed ||
      ((initialItem.status === 'Completed' || initialItem.status === 'COMPLETED') &&
        initialItem.seats_remaining !== undefined &&
        initialItem.seats_limit !== undefined &&
        initialItem.seats_limit - initialItem.seats_remaining > 0);
    setIsAttendanceConfirmed(isConf);
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
                <LucideIcon name={statusColors.icon} {...styles.badgeIconProps(statusColors.text)} />
                <BadgeText {...styles.badgeText(statusColors.text)}>{statusTag}</BadgeText>
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

        {/* ROW 2 - METADATA */}
        <HStack {...styles.headerMetaHStack}>
          <HStack {...styles.trainingMetaItemHStack}>
            <LucideIcon name="Calendar" {...styles.cardMetaIconProps} />
            <Text {...styles.cardMetaSmText}>{dateTime}</Text>
          </HStack>

          {(deliveryMode === 'offline' || deliveryMode === 'hybrid') && (
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="MapPin" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>{locationValue || '-'}</Text>
            </HStack>
          )}

          {(deliveryMode === 'online' || deliveryMode === 'hybrid') && (
            <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                if (linkValue) openExternalLink(linkValue);
              }}
            >
              <HStack {...styles.trainingMetaItemHStack}>
                <LucideIcon name="Video" {...styles.cardMetaIconProps} />
                <Text {...styles.headerLinkText}>{linkValue || '-'}</Text>
              </HStack>
            </Pressable>
          )}

          <HStack {...styles.trainingMetaItemHStack}>
            <LucideIcon name="Users" {...styles.cardMetaIconProps} />
            <Text {...styles.cardMetaSmText}>{participantsDisplay}</Text>
          </HStack>
        </HStack>

        {/* ROW 3 - NOTES / DESCRIPTION */}
        {descriptionText ? (
          <Box {...styles.notesBox}>
            <Text {...styles.notesText} numberOfLines={2} ellipsizeMode="tail">
              {descriptionText}
            </Text>
          </Box>
        ) : null}

        {/* ROW 4 - ACTIONS */}
        {footer ? (
          footer(item)
        ) : (
          <HStack {...styles.requestedByRowHStack}>
            <HStack {...styles.badgeContentHStack}>
              {/* DRAFT */}
              {currentStatus === 'Draft' ? (
                <>
                  <Button variant={"outlineghost" as any} {...styles.outlineActionBtn} onPress={() => { (navigation as any).navigate('form-training-session', { sessionId: item.id, type: FORM_MODE.EDIT, }); }}>
                    <ButtonText {...(styles.outlineActionBtnText as any)}>{t('common.edit', 'Edit')}</ButtonText>
                  </Button>

                  {canCopy && (
                    <Button variant="outline" {...styles.outlineActionBtn} onPress={handleCopySession}>
                      <ButtonIcon as={LucideIcon} name="Copy" {...styles.cardCopyIconProps} />
                      <ButtonText {...(styles.outlineActionBtnText as any)}>
                        {t('supportProvider.supportOfferings.cards.copySession', 'Copy Session')}
                      </ButtonText>
                    </Button>
                  )}

                  <Button variant="solid" {...styles.detailsBtn} onPress={() => setIsExpanded((prev) => !prev)}>
                    <ButtonText {...(styles.detailsBtnText as any)}>
                      {isExpanded
                        ? t('supportProvider.supportOfferings.cards.hideDetails', 'Hide Details')
                        : t('supportProvider.supportOfferings.cards.viewDetails', 'View Details')}
                    </ButtonText>
                  </Button>
                </>
              ) : currentStatus === 'In progress' ? (
                /* IN PROGRESS */
                <>
                  <Button variant="solid" {...styles.completeActionBtn} onPress={() => setIsCompleteModalOpen(true)} disabled={isCompleting}  >
                    <ButtonIcon as={LucideIcon} name="CheckCircle" {...styles.cardWhiteIconProps} />
                    <ButtonText {...(styles.completeActionBtnText as any)}>
                      {t('supportProvider.supportOfferings.cards.complete', 'Complete')}
                    </ButtonText>
                  </Button>

                  <Button variant="solid" {...styles.detailsBtn} onPress={() => setIsExpanded((prev) => !prev)}>
                    <ButtonText {...(styles.detailsBtnText as any)}>
                      {isExpanded
                        ? t('supportProvider.supportOfferings.cards.hideDetails', 'Hide Details')
                        : t('supportProvider.supportOfferings.cards.viewDetails', 'View Details')}
                    </ButtonText>
                  </Button>
                </>
              ) : (
                /* UPCOMING / COMPLETED */
                <>
                  {canCopy && (
                    <Button variant="outline" {...styles.outlineActionBtn} onPress={handleCopySession}>
                      <ButtonIcon as={LucideIcon} name="Copy" {...styles.cardCopyIconProps} />
                      <ButtonText {...(styles.outlineActionBtnText as any)}>
                        {t('supportProvider.supportOfferings.cards.copySession', 'Copy Session')}
                      </ButtonText>
                    </Button>
                  )}

                  {currentStatus === 'Completed' && !isAttendanceConfirmed && (
                    <Button variant={'outlineghost' as any}  {...styles.outlineActionBtn} onPress={() => setIsCompleteModalOpen(true)}  >
                      <ButtonText {...(styles.outlineActionBtnText as any)}>
                        {t('supportProvider.supportOfferings.cards.confirmAttendance', 'Confirm Attendance')}
                      </ButtonText>
                    </Button>
                  )}

                  <Button variant="solid" {...styles.detailsBtn} onPress={() => setIsExpanded((prev) => !prev)}>
                    <ButtonText {...(styles.detailsBtnText as any)}>
                      {isExpanded
                        ? t('supportProvider.supportOfferings.cards.hideDetails', 'Hide Details')
                        : t('supportProvider.supportOfferings.cards.viewDetails', 'View Details')}
                    </ButtonText>
                  </Button>
                </>
              )}
            </HStack>
          </HStack>
        )}

        {/* ACCORDION CONTENT */}
        {!footer && isExpanded && (
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

                {currentStatus === 'COMPLETED' && !isAttendanceConfirmed && (
                  <Button variant="solid"  {...styles.confirmAttendanceBtn} onPress={() => setIsCompleteModalOpen(true)}  >
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
                    <Text {...styles.cardValueBoldText}>{expectedParticipants}</Text>
                  </VStack>

                  <VStack {...styles.attendanceItemVStack}>
                    <Text {...styles.attendanceLabelText}>
                      {t('supportProvider.supportOfferings.cards.confirmedPresent', 'Confirmed Present')}
                    </Text>

                    {confirmedPresent > 0 ? (
                      <HStack {...styles.badgeContentHStack}>
                        <Text {...styles.cardSuccessBoldText}>{confirmedPresent}</Text>
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
            {(currentStatus !== 'COMPLETED' || files.length > 0) && (
              <VStack {...styles.sectionVStack}>
                <HStack {...styles.materialsHeaderHStack}>
                  <Text {...styles.cardSectionTitleText}>
                    {t('supportProvider.supportOfferings.cards.sessionMaterials', 'Session Materials')}
                  </Text>

                  {currentStatus !== 'COMPLETED' && (
                    <Pressable {...styles.uploadMaterialBtn} onPress={handleUploadPress}>
                      <HStack {...styles.badgeContentHStack}>
                        <LucideIcon name="Upload" {...styles.cardMetaIconProps} />
                        <Text {...styles.cardMetaText} fontWeight="$bold">
                          {t('supportProvider.supportOfferings.cards.uploadMaterial', 'Upload Material')}
                        </Text>
                      </HStack>
                    </Pressable>
                  )}
                </HStack>

                {files.length > 0 && (
                  <VStack {...styles.filesListVStack}>
                    {files.map((file, idx) => (
                      <Box key={idx} {...styles.resourceCard}>
                        <HStack {...styles.fileCardOuterHStack}>
                          <HStack {...styles.fileCardInnerHStack}>
                            <LucideIcon name="FileText" {...styles.cardFileTextIconProps} />
                            <Text {...styles.resourceFileNameText} numberOfLines={1} ellipsizeMode="tail">
                              {formatResourceName(file)}
                            </Text>
                          </HStack>

                          <Pressable onPress={() => showAlert('info', t('supportProvider.supportOfferings.cards.alerts.downloading', { name: file.name }))}  {...styles.iconPressablePadding}>
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
        )}
      </VStack>

      {/* SESSION COMPLETE MODAL */}
      <SessionCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        sessionTitle={item.title}
        expectedParticipantsCount={expectedParticipants}
        initialParticipants={item.participantList}
        onConfirmComplete={handleConfirmSessionComplete}
      />
    </Box>
  );
};

// ---------- ListCard ----------

export interface TrainingCardProps {
  items: TrainingSessionItem[];
  isShowLoadMore?: boolean;
  onLoadMoreItems?: () => void;
  isLoadingMore?: boolean;
  _card?: any;
}

export default function TrainingCard({
  items = [],
  isShowLoadMore,
  onLoadMoreItems,
  isLoadingMore = false,
  _card,
}: TrainingCardProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <VStack {...styles.listContainer}>
      {items.map((item) => (
        <Card
          key={item.id}
          item={item}
          {..._card}
        />
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
