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
  Divider,
  useAlert,
  Button,
  ButtonText,
  ButtonIcon,
} from '@ui';
import moment from 'moment';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { openFilePicker } from '../../../../../project-player/components/Task/FileEvidence/file-picker';
import type { ProvinceEntity, SiteEntity } from '@app-types/Users';
import { getTrainingSessions, completeTrainingSession } from '../../../../../services/SupportOfferingsServices/supportOfferingsService';
import type { MaterialItem, TrainingSessionItem } from '../../../../../constants/SUPPORT_OFFERINGS_MOCK';
import SessionCompleteModal from '../modals/SessionCompleteModal';
import styles from '../../styles';

const formatLocationDisplay = (item: TrainingSessionItem) => {
  if (item.location) {
    if (item.location.toLowerCase().includes('soweto')) {
      return 'Soweto';
    }

    if (item.location.toLowerCase().includes('durban')) {
      return 'Durban';
    }

    return item.location;
  }

  return '-';
};

const formatParticipantsDisplay = (item: TrainingSessionItem) => {
  const expected = Number(item.expected_participants ?? item.expectedParticipants ?? 0);

  const confirmed = Number(
    item.confirmed_present ??
    item.confirmedPresent ??
    0
  );

  return `${confirmed} / ${expected} participants`;
};

const getProviderInfo = (item: TrainingSessionItem) => {
  let orgName = '';
  let provinceName = item.province || '';

  if (item.requestedBy) {
    const orgMatch = item.requestedBy.match(/\(([^)]+)\)/);
    if (orgMatch) {
      orgName = orgMatch[1];
    } else if (item.requestedBy.includes('•')) {
      orgName = item.requestedBy.split('•')[0].trim();
    } else {
      orgName = item.requestedBy.trim();
    }

    if (!provinceName && item.requestedBy.includes('•')) {
      provinceName = item.requestedBy.split('•')[1].trim();
    }
  }

  return {
    orgName: orgName || 'Johannesburg Youth Development',
    provinceName: provinceName || 'Gauteng',
  };
};

const getDeliveryBadge = (formatStr?: string) => {
  const fmt = (formatStr || '').toLowerCase();
  if (fmt === 'virtual' || fmt === 'online') {
    return {
      label: 'Online',
      icon: 'Video',
      bg: '$blue50',
      border: '$blue200',
      color: '$blue600',
    };
  }
  if (fmt === 'hybrid') {
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
  switch (status) {
    case 'Draft':
      return {
        bg: '$backgroundLight100',
        border: '$borderColor',
        text: '$textMuted',
        icon: 'FileText',
      };

    case 'Upcoming':
      return {
        bg: '$blue50',
        border: '$blue200',
        text: '$blue600',
        icon: 'Clock',
      };

    case 'In progress':
    case 'In Progress':
      return {
        bg: '$observationTaskBg',
        border: '#fde68a',
        text: '$warningIconColor',
        icon: 'AlertCircle',
      };

    case 'Completed':
      return {
        bg: '$success50',
        border: '#a7f3d0',
        text: '$success600',
        icon: 'CheckCircle',
      };

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
  const match = file.info?.match(/(\d+(?:\.\d+)?\s*(?:MB|KB|GB|B))/i);
  if (match && !file.name.includes(match[1])) {
    return `${file.name} (${match[1]})`;
  }
  return file.name;
};
// ---------- Card ----------

interface CardProps {
  item: TrainingSessionItem;
}

const Card: React.FC<CardProps> = ({ item: initialItem }) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const navigation = useNavigation();

  const [item, setItem] = useState<TrainingSessionItem>(initialItem);
  const [isExpanded, setIsExpanded] = useState(false);
  const [files, setFiles] = useState<MaterialItem[]>(initialItem.materials || []);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    setItem(initialItem);
    setFiles(initialItem.materials || []);
  }, [initialItem]);

  /* =========================
     OLD FUNCTIONALITY - KEEP
  ========================== */

  const displayDate = item.start_date
    ? moment(
      typeof item.start_date === 'number' || !isNaN(Number(item.start_date))
        ? Number(item.start_date) * 1000
        : item.start_date
    ).format('DD MMM YYYY')
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
      : '--';

  const displayFormat =
    item.delivery_mode?.value
      ? item.delivery_mode.value.toLowerCase().includes('online') ||
        item.delivery_mode.value.toLowerCase().includes('virtual')
        ? 'Virtual'
        : item.delivery_mode.value.toLowerCase().includes('hybrid')
          ? 'Hybrid'
          : 'In-person'
      : item.training_type || 'In-person';

  const displayRequestedBy = item.mentor_name
    ? item.organization?.organization_code || item.organization_code
      ? `${item.mentor_name} (${item.organization?.organization_code || item.organization_code
      })`
      : item.mentor_name
    : 'Unknown Mentor';

  const getStatus = () => {
    if (item.status === 'DRAFT' || item.status === 'Draft') {
      return 'Draft';
    }

    if (item.status === 'COMPLETED' || item.status === 'Completed') {
      return 'Completed';
    }

    if (item.start_date) {
      const startMs =
        typeof item.start_date === 'number' ||
          !isNaN(Number(item.start_date))
          ? Number(item.start_date) * 1000
          : new Date(item.start_date).getTime();

      const today = new Date();
      const sessionDate = new Date(startMs);

      const isToday =
        sessionDate.getDate() === today.getDate() &&
        sessionDate.getMonth() === today.getMonth() &&
        sessionDate.getFullYear() === today.getFullYear();

      if (sessionDate.getTime() > today.getTime() && !isToday) {
        return 'Upcoming';
      }

      if (isToday) {
        return 'In progress';
      }

      return 'Completed';
    }

    return item.status || 'Upcoming';
  };

  const currentStatus = getStatus();

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'Draft':
        return {
          bg: '$backgroundLight100',
          border: 'transparent',
          text: '$textMuted',
          icon: 'FileText',
        };

      case 'Upcoming':
        return {
          bg: '$blue50',
          border: 'transparent',
          text: '$blue600',
          icon: 'Clock',
        };

      case 'In progress':
        return {
          bg: '$observationTaskBg',
          border: 'transparent',
          text: '$warningIconColor',
          icon: 'AlertCircle',
        };

      case 'Completed':
      default:
        return {
          bg: '$success50',
          border: 'transparent',
          text: '$success600',
          icon: 'CheckCircle',
        };
    }
  };

  const statusColors = getStatusColors(currentStatus);

  const canCopy = !!item.can_be_copied;

  const expectedCount = item.expected_participants ?? 0;

  const confirmedCount =
    item.confirmed_present !== undefined
      ? `${item.confirmed_present}`
      : '0';

  const handleCopySession = () => {
    showAlert(
      'success',
      t('supportProvider.supportOfferings.cards.alerts.sessionCopied')
    );
  };

  /*
   * IMPORTANT:
   * Keep participant ID based completion functionality.
   * Do NOT change this to presentCount.
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

      setItem((prev) => ({
        ...prev,
        status: 'Completed',
        confirmed_present: selectedParticipantIds.length,
        completionNotes:
          prev.completionNotes ||
          t(
            'supportProvider.supportOfferings.cards.alerts.sessionCompleted'
          ),
      }));

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
   * Keep upload functionality exactly as before
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

      const newMaterials: MaterialItem[] = selectedFiles.map((file) => {
        const name =
          file.name || file.fileName || 'Untitled File';

        const sizeBytes =
          file.size || file.fileSize || 0;

        const sizeStr =
          sizeBytes > 0
            ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
            : 'Unknown size';

        const ext =
          name.split('.').pop()?.toUpperCase() || 'FILE';

        const dateStr = new Date()
          .toISOString()
          .split('T')[0]
          .replace(/-/g, '/');

        return {
          name,
          info: `${ext} • ${sizeStr} • Uploaded ${dateStr}`,
        };
      });

      setFiles((prev) => [...prev, ...newMaterials]);

      showAlert(
        'success',
        t(
          'supportProvider.supportOfferings.cards.alerts.materialUploaded'
        )
      );
    } catch (err) {
      // User cancelled picker or error occurred
    }
  };

  /* =========================
     NEW UI DISPLAY HELPERS
  ========================== */

  const deliveryBadge = getDeliveryBadge(item.format);

  const formattedDate = item.date
    ? moment(item.date).isValid()
      ? moment(item.date).format('ddd, D MMM YYYY')
      : item.date
    : displayDate;

  const startTime =
    item.time?.split('-')[0]?.trim() ||
    item.time ||
    '';

  const dateTime = startTime
    ? `${formattedDate}, ${startTime}`
    : formattedDate;

  const duration =
    (item as any).duration ||
    (item.time?.toLowerCase().includes('hour')
      ? item.time
      : displayTime !== '--'
        ? displayTime
        : '3 hours');

  const locationText = formatLocationDisplay(item);

  const participantsText = formatParticipantsDisplay(item);

  const { orgName, provinceName } = getProviderInfo(item);

  const descriptionText =
    item.notes || (item as any).description;

  const formatLower = (
    item.format ||
    displayFormat ||
    ''
  ).toLowerCase();

  const isOnline =
    formatLower === 'online' ||
    formatLower === 'virtual' ||
    formatLower.includes('online') ||
    formatLower.includes('virtual');

  const hasPhysicalLocation =
    !isOnline && Boolean(locationText);

  return (
    <Box {...styles.cardContainer}>
      <VStack {...styles.cardFullVStack}>

        {/* =========================
            ROW 1
        ========================== */}

        <HStack {...styles.headerTopHStack}>
          <HStack {...styles.headerTitleBadgeHStack}>
            <Text {...styles.cardHeaderTitleText}>
              {item.title}
            </Text>

            <Badge
              {...styles.badgeContainer(
                statusColors.bg,
                statusColors.border
              )}
            >
              <HStack {...styles.badgeContentHStack}>
                <LucideIcon
                  name={statusColors.icon}
                  {...styles.badgeIconProps(
                    statusColors.text
                  )}
                />

                <BadgeText
                  {...styles.badgeText(
                    statusColors.text
                  )}
                >
                  {currentStatus}
                </BadgeText>
              </HStack>
            </Badge>
          </HStack>

          <Badge
            {...styles.deliveryBadgeContainer(
              deliveryBadge.bg,
              deliveryBadge.border
            )}
          >
            <HStack {...styles.badgeContentHStack}>
              <LucideIcon
                name={deliveryBadge.icon}
                {...styles.badgeIconProps(
                  deliveryBadge.color
                )}
              />

              <BadgeText
                {...styles.deliveryBadgeText(
                  deliveryBadge.color
                )}
              >
                {deliveryBadge.label}
              </BadgeText>
            </HStack>
          </Badge>
        </HStack>

        {/* =========================
            ROW 2 - METADATA
        ========================== */}

        <HStack {...styles.headerMetaHStack}>

          <HStack {...styles.trainingMetaItemHStack}>
            <LucideIcon
              name="Calendar"
              {...styles.cardMetaIconProps}
            />

            <Text {...styles.cardMetaSmText}>
              {dateTime}
            </Text>
          </HStack>

          {/* <HStack {...styles.trainingMetaItemHStack}>
            <LucideIcon
              name="Clock"
              {...styles.cardMetaIconProps}
            />

            <Text {...styles.cardMetaSmText}>
              {duration}
            </Text>
          </HStack> */}

          {hasPhysicalLocation && (
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon
                name="MapPin"
                {...styles.cardMetaIconProps}
              />

              <Text {...styles.cardMetaSmText}>
                {locationText}
              </Text>
            </HStack>
          )}

          <HStack {...styles.trainingMetaItemHStack}>
            <LucideIcon
              name="Users"
              {...styles.cardMetaIconProps}
            />

            <Text {...styles.cardMetaSmText}>
              {participantsText}
            </Text>
          </HStack>

        </HStack>

        {/* =========================
            ROW 3 - NOTES
        ========================== */}

        {descriptionText ? (
          <Box {...styles.notesBox}>
            <Text {...styles.notesText} numberOfLines={2} ellipsizeMode="tail">
              {descriptionText}
            </Text>
          </Box>
        ) : null}

        {/* =========================
            ROW 4 - PROVIDER + ACTIONS
        ========================== */}

        <HStack {...styles.requestedByRowHStack}>

          <Text {...styles.cardRequestedByText}>
            {t(
              'supportProvider.supportOfferings.cards.providedBy',
              'Provided by:'
            )}{' '}

            <Text {...styles.cardRequestedByOrgText}>
              {orgName}
            </Text>

            {provinceName ? (
              <Text {...styles.cardRequestedByProvinceText}>
                {` • ${provinceName}`}
              </Text>
            ) : null}
          </Text>

          <HStack
            {...styles.badgeContentHStack}
            space="sm"
          >

            {/* DRAFT */}
            {currentStatus === 'Draft' ? (
              <>
                <Button
                  variant="solid"
                  {...styles.outlineActionBtn}
                  onPress={() => {
                    (navigation as any).navigate(
                      'create-training-session',
                      {
                        sessionId: item.id,
                        item,
                      }
                    );
                  }}
                >
                  <ButtonText
                    {...styles.outlineActionBtnText}
                  >
                    {t('common.edit', 'Edit')}
                  </ButtonText>
                </Button>

                <Button
                  variant="outlineghost"
                  {...styles.detailsBtn}
                  onPress={() =>
                    setIsExpanded((prev) => !prev)
                  }
                >
                  <ButtonText
                    {...styles.detailsBtnText}
                  >
                    {isExpanded
                      ? t(
                        'supportProvider.supportOfferings.cards.hideDetails',
                        'Hide Details'
                      )
                      : t(
                        'supportProvider.supportOfferings.cards.viewDetails',
                        'View Details'
                      )}
                  </ButtonText>
                </Button>
              </>
            ) : currentStatus === 'In progress' ? (

              /* IN PROGRESS */
              <>
                <Button
                  variant="solid"
                  {...styles.completeActionBtn}
                  onPress={() =>
                    setIsCompleteModalOpen(true)
                  }
                  disabled={isCompleting}
                >
                  <ButtonIcon
                    as={LucideIcon}
                    name="CheckCircle"
                    {...styles.cardWhiteIconProps}
                  />

                  <ButtonText
                    {...styles.completeActionBtnText}
                  >
                    {t(
                      'supportProvider.supportOfferings.cards.complete',
                      'Complete'
                    )}
                  </ButtonText>
                </Button>

                <Button
                  variant="solid"
                  {...styles.detailsBtn}
                  onPress={() =>
                    setIsExpanded((prev) => !prev)
                  }
                >
                  <ButtonText
                    {...styles.detailsBtnText}
                  >
                    {isExpanded
                      ? t(
                        'supportProvider.supportOfferings.cards.hideDetails',
                        'Hide Details'
                      )
                      : t(
                        'supportProvider.supportOfferings.cards.viewDetails',
                        'View Details'
                      )}
                  </ButtonText>
                </Button>
              </>

            ) : (

              /* UPCOMING / COMPLETED */
              <>
                {canCopy && (
                  <Button
                    variant="outlineghost"
                    {...styles.outlineActionBtn}
                    onPress={handleCopySession}
                  >
                    <ButtonIcon
                      as={LucideIcon}
                      name="Copy"
                      {...styles.cardCopyIconProps}
                    />

                    <ButtonText
                      {...styles.outlineActionBtnText}
                    >
                      {t(
                        'supportProvider.supportOfferings.cards.copySession',
                        'Copy Session'
                      )}
                    </ButtonText>
                  </Button>
                )}

                <Button
                  variant="solid"
                  {...styles.detailsBtn}
                  onPress={() =>
                    setIsExpanded((prev) => !prev)
                  }
                >
                  <ButtonText
                    {...styles.detailsBtnText}
                  >
                    {isExpanded
                      ? t(
                        'supportProvider.supportOfferings.cards.hideDetails',
                        'Hide Details'
                      )
                      : t(
                        'supportProvider.supportOfferings.cards.viewDetails',
                        'View Details'
                      )}
                  </ButtonText>
                </Button>
              </>
            )}

          </HStack>
        </HStack>

        {/* =========================
            ACCORDION CONTENT
        ========================== */}

        {isExpanded && (
          <VStack {...styles.expandedContentVStack}>

            {/* LOCATION / VIRTUAL LINK */}

            {(item.virtualLink ||
              item.location ||
              locationText ||
              isOnline) && (
                <VStack {...styles.sectionVStack}>

                  <Text {...styles.cardSectionTitleText}>
                    {isOnline && !item.location
                      ? t(
                        'supportProvider.supportOfferings.cards.virtualLink',
                        'Virtual Link'
                      )
                      : t(
                        'supportProvider.supportOfferings.cards.location',
                        'Location'
                      )}
                  </Text>

                  {item.virtualLink && isOnline && (
                    <HStack {...styles.virtualLinkHStack}>
                      <LucideIcon
                        name="Video"
                        {...styles.cardPrimaryIconProps}
                      />

                      <Text
                        {...styles.cardPrimaryLinkText}
                        onPress={() => {
                          if (
                            item.virtualLink &&
                            typeof window !== 'undefined'
                          ) {
                            window.open(
                              item.virtualLink,
                              '_blank'
                            );
                          }
                        }}
                      >
                        {item.virtualLink}
                      </Text>
                    </HStack>
                  )}

                  {!isOnline &&
                    (item.location || locationText) && (
                      <HStack
                        {...styles.virtualLinkHStack}
                      >
                        <LucideIcon
                          name="MapPin"
                          {...styles.cardMetaIconProps}
                        />

                        <Text
                          {...styles.cardLocationValueText}
                        >
                          {item.location ||
                            locationText}
                        </Text>
                      </HStack>
                    )}

                </VStack>
              )}

            {/* =========================
                ATTENDANCE
            ========================== */}

            <VStack {...styles.sectionVStack}>

              <Text {...styles.cardSectionTitleText}>
                {t(
                  'supportProvider.supportOfferings.cards.attendance',
                  'Attendance'
                )}
              </Text>

              <Box {...styles.attendanceBox}>
                <HStack {...styles.attendanceRowHStack}>

                  <VStack
                    {...styles.attendanceItemVStack}
                  >
                    <Text {...styles.cardMetaText}>
                      {t(
                        'supportProvider.supportOfferings.cards.expectedParticipants',
                        'Expected Participants'
                      )}
                    </Text>

                    <Text
                      {...styles.cardValueBoldText}
                    >
                      {expectedCount}
                    </Text>
                  </VStack>

                  <VStack
                    {...styles.attendanceItemVStack}
                  >
                    <Text {...styles.cardMetaText}>
                      {t(
                        'supportProvider.supportOfferings.cards.confirmedPresent',
                        'Confirmed Present'
                      )}
                    </Text>

                    {currentStatus === 'Completed' &&
                      confirmedCount &&
                      confirmedCount !== '0' ? (
                      <HStack
                        {...styles.badgeContentHStack}
                      >
                        <Text
                          {...styles.cardSuccessBoldText}
                        >
                          {confirmedCount}
                        </Text>

                        <LucideIcon
                          name="CheckCircle"
                          {...styles.cardSuccessIconProps}
                        />
                      </HStack>
                    ) : (
                      <Text {...styles.cardMetaSmText}>
                        {confirmedCount &&
                          confirmedCount !== '0'
                          ? confirmedCount
                          : currentStatus ===
                            'In progress'
                            ? '--'
                            : t(
                              'supportProvider.supportOfferings.cards.notConfirmed',
                              'Not Confirmed'
                            )}
                      </Text>
                    )}
                  </VStack>

                </HStack>
              </Box>
            </VStack>

            {/* =========================
                SESSION RESOURCES
            ========================== */}

            {files.length > 0 && (
              <VStack {...styles.sectionVStack}>

                <Text {...styles.cardSectionTitleText}>
                  {t(
                    'supportProvider.supportOfferings.cards.sessionResources',
                    'Session Resources'
                  )}
                </Text>

                <VStack {...styles.filesListVStack}>
                  {files.map((file, idx) => (
                    <Box
                      key={idx}
                      {...styles.resourceCard}
                    >
                      <HStack
                        {...styles.fileCardOuterHStack}
                      >

                        <HStack
                          {...styles.fileCardInnerHStack}
                        >
                          <LucideIcon
                            name="FileText"
                            {...styles.cardFileTextIconProps}
                          />

                          <Text
                            {...styles.resourceFileNameText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {formatResourceName(file)}
                          </Text>
                        </HStack>

                        <Pressable
                          onPress={() =>
                            showAlert(
                              'info',
                              t(
                                'supportProvider.supportOfferings.cards.alerts.downloading',
                                {
                                  name: file.name,
                                }
                              )
                            )
                          }
                          {...styles.iconPressablePadding}
                        >
                          <HStack
                            {...styles.badgeContentHStack}
                          >
                            <LucideIcon
                              name="Download"
                              {...styles.cardPrimaryIconProps}
                            />

                            <Text
                              {...styles.downloadLinkText}
                            >
                              {t(
                                'common.download',
                                'Download'
                              )}
                            </Text>
                          </HStack>
                        </Pressable>

                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            )}

            {/* =========================
                COMPLETION / SESSION NOTES
            ========================== */}

            {(currentStatus === 'Completed'
              ? item.completionNotes || item.notes
              : item.notes) && (
                <VStack {...styles.sectionVStack}>

                  <Text {...styles.cardSectionTitleText}>
                    {currentStatus === 'Completed'
                      ? t(
                        'supportProvider.supportOfferings.cards.completionNotes',
                        'Completion Notes'
                      )
                      : t(
                        'supportProvider.supportOfferings.cards.sessionNotes',
                        'Session Notes'
                      )}
                  </Text>

                  <Box {...styles.notesBox}>
                    <Text
                      {...styles.cardDescriptionText}
                    >
                      {currentStatus === 'Completed'
                        ? item.completionNotes ||
                        item.notes
                        : item.notes}
                    </Text>
                  </Box>

                </VStack>
              )}

            {/* =========================
                UPLOAD MATERIAL
                OLD FUNCTIONALITY
            ========================== */}

            {currentStatus !== 'Completed' && (
              <VStack {...styles.sectionVStack}>

                <HStack
                  {...styles.materialsHeaderHStack}
                >
                  <Text {...styles.cardSectionTitleText}>
                    {t(
                      'supportProvider.supportOfferings.cards.sessionMaterials',
                      'Session Materials'
                    )}
                  </Text>

                  <Pressable
                    {...styles.uploadMaterialBtn}
                    onPress={handleUploadPress}
                  >
                    <HStack
                      {...styles.badgeContentHStack}
                    >
                      <LucideIcon
                        name="Upload"
                        {...styles.cardMetaIconProps}
                      />

                      <Text
                        {...styles.cardMetaText}
                        fontWeight="$bold"
                      >
                        {t(
                          'supportProvider.supportOfferings.cards.uploadMaterial',
                          'Upload Material'
                        )}
                      </Text>
                    </HStack>
                  </Pressable>
                </HStack>

              </VStack>
            )}

            {/* =========================
                SESSION COMPLETE
            ========================== */}

            {currentStatus === 'In progress' && (
              <HStack {...styles.sessionCompleteHStack}>
                <Button
                  variant="solid"
                  {...styles.completeActionBtn}
                  onPress={() => setIsCompleteModalOpen(true)}
                  disabled={isCompleting}
                >
                  <ButtonIcon
                    as={LucideIcon}
                    name="CheckCircle"
                    {...styles.cardWhiteIconProps}
                  />

                  <ButtonText {...styles.completeActionBtnText}>
                    {t(
                      'supportProvider.supportOfferings.cards.complete',
                      'Complete'
                    )}
                  </ButtonText>
                </Button>
              </HStack>
            )}

          </VStack>
        )}
      </VStack>

      {/* =========================
          SESSION COMPLETE MODAL
          KEEP OLD FUNCTIONALITY
      ========================== */}

      <SessionCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() =>
          setIsCompleteModalOpen(false)
        }
        sessionTitle={item.title}
        expectedParticipantsCount={expectedCount}
        initialParticipants={item.participantList}
        onConfirmComplete={
          handleConfirmSessionComplete
        }
      />
    </Box>
  );
};

// ---------- ListCard ----------

interface TrainingCardProps {
  search?: string;
  status?: string;
  province?: string;
  site?: string;
}

export default function TrainingCard({
  search,
  status,
  province,
  site,
}: TrainingCardProps): React.ReactElement {
  const { t } = useLanguage();
  const [trainings, setTrainings] = useState<TrainingSessionItem[]>([]);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getTrainingSessions({
      search,
      status,
      province,
      site,
      limit,
    }).then((res) => {
      setTrainings(res?.result?.data || []);
      setTotal(res?.total || 0);
    });
  }, [search, status, province, site, limit]);

  const handleLoadMore = () => {
    setLimit((prev) => prev + 5);
  };

  return (
    <VStack {...styles.listContainer}>
      {trainings.map((item) => (
        <Card key={item.id} item={item} />
      ))}
      {trainings.length === limit && (
        <Box alignItems="center" mt="$4" width="100%">
          <Button onPress={handleLoadMore}>
            <ButtonText>{t('supportProvider.supportOfferings.buttonTexts.loadMoreSessions')}</ButtonText>
          </Button>
        </Box>
      )}
    </VStack>
  );
}
