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

  useEffect(() => {
    setItem(initialItem);
    setFiles(initialItem.materials || []);
  }, [initialItem]);

  const displayDate = item.start_date
    ? moment(typeof item.start_date === 'number' || !isNaN(Number(item.start_date)) ? Number(item.start_date) * 1000 : item.start_date).format('DD MMM YYYY')
    : '--';

  const displayTime = item.start_date && item.end_date
    ? `${moment(typeof item.start_date === 'number' || !isNaN(Number(item.start_date)) ? Number(item.start_date) * 1000 : item.start_date).format('HH:mm')} - ${moment(typeof item.end_date === 'number' || !isNaN(Number(item.end_date)) ? Number(item.end_date) * 1000 : item.end_date).format('HH:mm')}`
    : '--';

  const displayFormat =
    item.delivery_mode?.value
      ? item.delivery_mode.value.toLowerCase().includes('online') || item.delivery_mode.value.toLowerCase().includes('virtual')
        ? 'Virtual'
        : item.delivery_mode.value.toLowerCase().includes('hybrid')
          ? 'Hybrid'
          : 'In-person'
      : item.training_type || 'In-person';

  const displayRequestedBy = item.mentor_name
    ? (item.organization?.organization_code || item.organization_code)
      ? `${item.mentor_name} (${item.organization?.organization_code || item.organization_code})`
      : item.mentor_name
    : 'Unknown Mentor';

  const getStatus = () => {
    if (item.status === 'DRAFT' || item.status === 'Draft') return 'Draft';
    if (item.status === 'COMPLETED' || item.status === 'Completed') return 'Completed';
    if (item.start_date) {
      const startMs = typeof item.start_date === 'number' || !isNaN(Number(item.start_date)) ? Number(item.start_date) * 1000 : new Date(item.start_date).getTime();
      const today = new Date();
      const sessionDate = new Date(startMs);
      const isToday =
        sessionDate.getDate() === today.getDate() &&
        sessionDate.getMonth() === today.getMonth() &&
        sessionDate.getFullYear() === today.getFullYear();
      if (sessionDate.getTime() > today.getTime() && !isToday) return 'Upcoming';
      if (isToday) return 'In progress';
      return 'Completed';
    }
    return item.status || 'Upcoming';
  };

  const currentStatus = getStatus();

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'Draft':
        return { bg: '$backgroundLight100', border: 'transparent', text: '$textMuted', icon: 'FileText' };
      case 'Upcoming':
        return { bg: '$blue50', border: 'transparent', text: '$blue600', icon: 'Clock' };
      case 'In progress':
        return { bg: '$observationTaskBg', border: 'transparent', text: '$warningIconColor', icon: 'AlertCircle' };
      case 'Completed':
      default:
        return { bg: '$success50', border: 'transparent', text: '$success600', icon: 'CheckCircle' };
    }
  };

  const statusColors = getStatusColors(currentStatus);
  const canCopy = !!item.can_be_copied;
  const expectedCount = item.expected_participants ?? 0;
  const confirmedCount = item.confirmed_present !== undefined ? `${item.confirmed_present}` : '0';

  const handleCopySession = () => {
    showAlert('success', t('supportProvider.supportOfferings.cards.alerts.sessionCopied'));
  };

  const [isCompleting, setIsCompleting] = useState(false);

  const handleConfirmSessionComplete = async (selectedParticipantIds: string[]) => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await completeTrainingSession(item.id, { mentees: selectedParticipantIds });
      setItem((prev) => ({
        ...prev,
        status: 'Completed',
        confirmed_present: selectedParticipantIds.length,
        completionNotes: prev.completionNotes || t('supportProvider.supportOfferings.cards.alerts.sessionCompleted'),
      }));
      showAlert('success', t('supportProvider.supportOfferings.cards.alerts.sessionCompleted'));
    } catch (error) {
      console.error('Error completing session via API:', error);
      showAlert('error', 'Failed to complete session. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUploadPress = async () => {
    try {
      const selectedFiles = await openFilePicker({
        allowMultiSelection: true,
        type: ['application/pdf', 'image/*', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      });

      if (!selectedFiles || selectedFiles.length === 0) return;

      const newMaterials: MaterialItem[] = selectedFiles.map((file) => {
        const name = file.name || file.fileName || 'Untitled File';
        const sizeBytes = file.size || file.fileSize || 0;
        const sizeStr =
          sizeBytes > 0 ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : 'Unknown size';
        const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '/');

        return {
          name,
          info: `${ext} • ${sizeStr} • Uploaded ${dateStr}`,
        };
      });

      setFiles((prev) => [...prev, ...newMaterials]);
      showAlert('success', t('supportProvider.supportOfferings.cards.alerts.materialUploaded'));
    } catch (err) {
      // User cancelled picker or error occurred
    }
  };

  return (
    <Box {...styles.cardContainer} {...styles.cardAccordionContainer}>
      {/* Accordion Header (Trigger) */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        {...styles.cardHeaderPressable}
      >
        <VStack {...styles.cardFullVStack}>
          {/* Row 1: Title + Badge & Chevron */}
          <HStack {...styles.headerTopHStack}>
            <HStack {...styles.headerTitleBadgeHStack}>
              <Text {...styles.cardHeaderTitleText}>
                {item.title}
              </Text>
              <Badge {...styles.badgeContainer(statusColors.bg)}>
                <HStack {...styles.badgeContentHStack}>
                  <LucideIcon name={statusColors.icon} {...styles.badgeIconProps(statusColors.text)} />
                  <BadgeText {...styles.badgeText(statusColors.text)}>
                    {currentStatus}
                  </BadgeText>
                </HStack>
              </Badge>
            </HStack>
            <LucideIcon
              name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
              {...styles.cardChevronIconProps}
            />
          </HStack>

          {/* Row 2: Metadata */}
          <HStack {...styles.headerMetaHStack}>
            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Calendar" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {displayDate}
              </Text>
            </HStack>

            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Clock" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {displayTime}
              </Text>
            </HStack>

            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon
                name={displayFormat === 'Virtual' ? 'Video' : 'MapPin'}
                {...styles.cardMetaIconProps}
              />
              <Text {...styles.cardMetaSmText}>
                {displayFormat}
              </Text>
            </HStack>

            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Users" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {item.participants}
              </Text>
            </HStack>
          </HStack>

          {/* Row 3: Requested by & Copy Button */}
          <HStack {...styles.requestedByRowHStack}>
            <Text {...styles.cardRequestedByText}>
              {t('supportProvider.supportOfferings.cards.requestedBy', { name: displayRequestedBy })}
            </Text>

            {currentStatus === 'Draft' ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  (navigation.navigate as any)('create-training-session', { sessionId: item.id });
                }}
              >
                {({ hovered }: any) => {
                  const isHovered = hovered || false;
                  return (
                    <Box {...styles.copySessionBox(isHovered)}>
                      <HStack {...styles.badgeContentHStack}>
                        <LucideIcon
                          name="Edit"
                          {...(isHovered ? styles.cardWhiteIconProps : styles.cardCopyIconProps)}
                        />
                        <Text
                          {...(isHovered ? styles.cardBtnWhiteText : styles.cardBtnPrimaryText)}
                        >
                          {t('common.edit', 'Edit')}
                        </Text>
                      </HStack>
                    </Box>
                  );
                }}
              </Pressable>
            ) : (
              canCopy && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCopySession();
                  }}
                >
                  {({ hovered }: any) => {
                    const isHovered = hovered || false;
                    return (
                    <Box {...styles.copySessionBox(isHovered)}>
                      <HStack {...styles.badgeContentHStack}>
                        <LucideIcon
                          name="Copy"
                          {...(isHovered ? styles.cardWhiteIconProps : styles.cardCopyIconProps)}
                        />
                        <Text
                          {...(isHovered ? styles.cardBtnWhiteText : styles.cardBtnPrimaryText)}
                        >
                          {t('supportProvider.supportOfferings.cards.copySession')}
                        </Text>
                      </HStack>
                    </Box>
                  );
                }}
              </Pressable>
            )
          )}
        </HStack>
      </VStack>
    </Pressable>

      {/* Accordion Content */}
      {isExpanded && (
        <VStack {...styles.expandedContentVStack}>
          <Divider {...styles.dividerStyle} />

          <VStack {...styles.expandedInnerVStack}>
            {/* Location / Virtual Link */}
            {(item.virtualLink || item.location) && (
              <VStack {...styles.sectionVStack}>
                <Text {...styles.cardSectionTitleText}>
                  {item.virtualLink && item.status === 'Completed'
                    ? t('supportProvider.supportOfferings.cards.virtualLink')
                    : t('supportProvider.supportOfferings.cards.location')}
                </Text>
                <VStack {...styles.sectionVStack}>
                  {item.virtualLink && (
                    <HStack {...styles.virtualLinkHStack}>
                      <LucideIcon name="Video" {...styles.cardPrimaryIconProps} />
                      <Text
                        {...styles.cardPrimaryLinkText}
                        onPress={() => item.virtualLink && typeof window !== 'undefined' && window.open(item.virtualLink, '_blank')}
                      >
                        {item.virtualLink}
                      </Text>
                    </HStack>
                  )}
                  {item.location && (
                    <HStack {...styles.virtualLinkHStack}>
                      <LucideIcon name="MapPin" {...styles.cardMetaIconProps} />
                      <Text {...styles.cardMetaSmText}>
                        {item.location}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </VStack>
            )}

            {/* Attendance */}
            <VStack {...styles.sectionVStack}>
              <Text {...styles.cardSectionTitleText}>
                {t('supportProvider.supportOfferings.cards.attendance')}
              </Text>
              <Box {...styles.attendanceBox}>
                <HStack {...styles.attendanceRowHStack}>
                  <VStack {...styles.attendanceItemVStack}>
                    <Text {...styles.cardMetaText}>
                      {t('supportProvider.supportOfferings.cards.expectedParticipants')}
                    </Text>
                    <Text {...styles.cardValueBoldText}>
                      {expectedCount}
                    </Text>
                  </VStack>
                  <VStack {...styles.attendanceItemVStack}>
                    <Text {...styles.cardMetaText}>
                      {t('supportProvider.supportOfferings.cards.confirmedPresent')}
                    </Text>
                    {currentStatus === 'Completed' && confirmedCount && confirmedCount !== '0' ? (
                      <HStack {...styles.badgeContentHStack}>
                        <Text {...styles.cardSuccessBoldText}>
                          {confirmedCount}
                        </Text>
                        <LucideIcon name="CheckCircle" {...styles.cardSuccessIconProps} />
                      </HStack>
                    ) : (
                      <Text {...styles.cardMetaSmText}>
                        {confirmedCount && confirmedCount !== '0'
                          ? confirmedCount
                          : (currentStatus === 'In progress'
                            ? '--'
                            : t('supportProvider.supportOfferings.cards.notConfirmed'))}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Box>
            </VStack>

            {/* Session Materials */}
            <VStack {...styles.sectionSmVStack}>
              <HStack {...styles.materialsHeaderHStack}>
                <Text {...styles.cardSectionTitleText}>
                  {t('supportProvider.supportOfferings.cards.sessionMaterials')}
                </Text>
                {currentStatus !== 'Completed' && (
                  <Pressable
                    {...styles.uploadMaterialBtn}
                    onPress={handleUploadPress}
                  >
                    <HStack {...styles.badgeContentHStack}>
                      <LucideIcon name="Upload" {...styles.cardMetaIconProps} />
                      <Text {...styles.cardMetaText} fontWeight="$bold">
                        {t('supportProvider.supportOfferings.cards.uploadMaterial')}
                      </Text>
                    </HStack>
                  </Pressable>
                )}
              </HStack>

              <VStack {...styles.filesListVStack}>
                {files.map((file, idx) => (
                  <Box
                    key={idx}
                    {...styles.materialFileCard}
                  >
                    <HStack {...styles.fileCardOuterHStack}>
                      <HStack {...styles.fileCardInnerHStack}>
                        <Box {...styles.fileIconBox}>
                          <LucideIcon name="FileText" {...styles.cardFileTextIconProps} />
                        </Box>
                        <VStack {...styles.fileTextVStack}>
                          <Text {...styles.cardValueBoldSmText} numberOfLines={1} ellipsizeMode="tail">
                            {file.name}
                          </Text>
                          <Text {...styles.cardMetaText}>
                            {file.info}
                          </Text>
                        </VStack>
                      </HStack>
                      <Pressable onPress={() => showAlert('info', t('supportProvider.supportOfferings.cards.alerts.downloading', { name: file.name }))} {...styles.iconPressablePadding}>
                        <LucideIcon name="Download" {...styles.cardMetaIconProps} />
                      </Pressable>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </VStack>

            {/* Session Notes / Completion Notes */}
            {(currentStatus === 'Completed' ? (item.completionNotes || item.notes) : item.notes) && (
              <VStack {...styles.sectionVStack}>
                <Text {...styles.cardSectionTitleText}>
                  {currentStatus === 'Completed'
                    ? t('supportProvider.supportOfferings.cards.completionNotes')
                    : t('supportProvider.supportOfferings.cards.sessionNotes')}
                </Text>
                <Box {...styles.notesBox}>
                  <Text {...styles.cardDescriptionText}>
                    {currentStatus === 'Completed' ? (item.completionNotes || item.notes) : item.notes}
                  </Text>
                </Box>
              </VStack>
            )}

            {/* Session Complete Button (In progress only) */}
            {currentStatus === 'In progress' && (
              <HStack {...styles.sessionCompleteHStack}>
                <Pressable
                  {...styles.sessionCompleteBtn}
                  onPress={() => setIsCompleteModalOpen(true)}
                >
                  <HStack {...styles.badgeContentHStack}>
                    <LucideIcon name="CheckCircle" {...styles.cardWhiteIconProps} />
                    <Text {...styles.cardBtnWhiteSemiboldText}>
                      {t('supportProvider.supportOfferings.cards.sessionComplete')}
                    </Text>
                  </HStack>
                </Pressable>
              </HStack>
            )}
          </VStack>
        </VStack>
      )}

      {/* Session Complete Modal */}
      <SessionCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        sessionTitle={item.title}
        expectedParticipantsCount={expectedCount}
        initialParticipants={item.participantList}
        onConfirmComplete={handleConfirmSessionComplete}
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
