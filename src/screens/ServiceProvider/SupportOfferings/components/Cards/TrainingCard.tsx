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
} from '@ui';
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

  const statusColors = getStatusColors(item.status);

  const handleCopySession = () => {
    navigation.navigate('form-training-session' as never, { type: 'copy', id: item.id } as never);
  };

  const handleConfirmSessionComplete = async (presentCount: number) => {
    try {
      await completeTrainingSession(item.id, { presentCount });
      setItem((prev) => ({
        ...prev,
        status: 'Completed',
        confirmedPresent: `${presentCount}`,
        completionNotes: prev.completionNotes || t('supportProvider.supportOfferings.cards.alerts.sessionCompleted'),
      }));
      showAlert('success', t('supportProvider.supportOfferings.cards.alerts.sessionCompleted'));
    } catch (error) {
      console.error('Error completing session via API:', error);
      showAlert('error', 'Failed to complete session. Please try again.');
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
                    {item.status}
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
                {item.date}
              </Text>
            </HStack>

            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon name="Clock" {...styles.cardMetaIconProps} />
              <Text {...styles.cardMetaSmText}>
                {item.time}
              </Text>
            </HStack>

            <HStack {...styles.trainingMetaItemHStack}>
              <LucideIcon
                name={item.format === 'Virtual' ? 'Video' : 'MapPin'}
                {...styles.cardMetaIconProps}
              />
              <Text {...styles.cardMetaSmText}>
                {item.format}
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
              {t('supportProvider.supportOfferings.cards.requestedBy', { name: item.requestedBy })}
            </Text>

            {item.status === 'Draft' ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.navigate('form-training-session' as never, { type: 'edit', sessionId: item.id } as never);
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
              item.hasCopyButton && (
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
                        as="a"
                        href={item.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        {...styles.cardPrimaryLinkText}
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
                      {item.expectedParticipants}
                    </Text>
                  </VStack>
                  <VStack {...styles.attendanceItemVStack}>
                    <Text {...styles.cardMetaText}>
                      {t('supportProvider.supportOfferings.cards.confirmedPresent')}
                    </Text>
                    {item.status === 'Completed' && item.confirmedPresent ? (
                      <HStack {...styles.badgeContentHStack}>
                        <Text {...styles.cardSuccessBoldText}>
                          {item.confirmedPresent}
                        </Text>
                        <LucideIcon name="CheckCircle" {...styles.cardSuccessIconProps} />
                      </HStack>
                    ) : (
                      <Text {...styles.cardMetaSmText}>
                        {item.confirmedPresent ||
                          (item.status === 'In progress'
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
                {item.status !== 'Completed' && (
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
            {(item.status === 'Completed' ? (item.completionNotes || item.notes) : item.notes) && (
              <VStack {...styles.sectionVStack}>
                <Text {...styles.cardSectionTitleText}>
                  {item.status === 'Completed'
                    ? t('supportProvider.supportOfferings.cards.completionNotes')
                    : t('supportProvider.supportOfferings.cards.sessionNotes')}
                </Text>
                <Box {...styles.notesBox}>
                  <Text {...styles.cardDescriptionText}>
                    {item.status === 'Completed' ? (item.completionNotes || item.notes) : item.notes}
                  </Text>
                </Box>
              </VStack>
            )}

            {/* Session Complete Button (In progress only) */}
            {item.status === 'In progress' && (
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
        expectedParticipantsCount={item.expectedParticipants}
        initialParticipants={item.participantList}
        onConfirmComplete={handleConfirmSessionComplete}
      />
    </Box>
  );
};

// ---------- ListCard ----------

interface TrainingCardProps {
  searchQuery?: string;
  statusFilter?: string;
  provinceFilter?: string;
  siteFilter?: string;
  draftStatusFilter?: string;
  provincesList?: ProvinceEntity[];
  sitesList?: SiteEntity[];
}

export default function TrainingCard({
  searchQuery,
  statusFilter,
  provinceFilter,
  siteFilter,
  draftStatusFilter,
  provincesList = [],
  sitesList = [],
}: TrainingCardProps): React.ReactElement {
  const [trainings, setTrainings] = useState<TrainingSessionItem[]>([]);

  useEffect(() => {
    getTrainingSessions({
      searchQuery,
      statusFilter,
      provinceFilter,
      siteFilter,
      draftStatusFilter,
      provincesList,
      sitesList,
    }).then(setTrainings);
  }, [searchQuery, statusFilter, provinceFilter, siteFilter, draftStatusFilter, provincesList, sitesList]);

  return (
    <VStack {...styles.listContainer}>
      {trainings.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </VStack>
  );
}
