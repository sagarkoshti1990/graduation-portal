import React, { useState, useEffect } from 'react';
import { Box, Button, ButtonIcon, ButtonText, HStack, Loader, LucideIcon, Pressable, Text, VStack, useAlert, Spinner, Container } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import PageHeader from '@components/PageHeader';
import moment from 'moment';
import openExternalLink from '@utils/openExternalLink';
import { getSessionDetails } from '../../../services/mentoringService';
import { requestorAssignMenteesToSession } from '../../../services/SessionSupportServices/sessionRequestorService';
import { getProvincesList } from '../../../services/usersService';
import AssignParticipantsModal from '../modals/AssignParticipantsModal';
import styles from '../styles';

const SessionDetailsScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute() as any;
  const { showAlert } = useAlert();

  const { sessionId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Fetch session details ONLY ONCE when sessionId mounts
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [detailsRes, provincesData] = await Promise.all([
          getSessionDetails(sessionId),
          getProvincesList().catch(() => [])
        ]);

        if (isMounted) {
          const sessionObj = detailsRes?.result || detailsRes?.data || detailsRes;
          if (sessionObj) {
            const rawProv = sessionObj.provinces?.[0] || sessionObj?.meta?.provinces?.[0];
            const foundProvince = provincesData?.find((e: any) => e._id === rawProv || e.externalId === rawProv || e.name === rawProv);
            const provinceName = foundProvince ? foundProvince.name : (rawProv || '');

            const linkValue = sessionObj.meeting_info_details?.link || sessionObj.meeting_info?.link || '';
            const descriptionText = sessionObj.description || sessionObj.notes || '';

            const startMoment = sessionObj.start_date
              ? moment(
                typeof sessionObj.start_date === 'number' || !isNaN(Number(sessionObj.start_date))
                  ? Number(sessionObj.start_date) * (Number(sessionObj.start_date) < 10000000000 ? 1000 : 1)
                  : sessionObj.start_date
              )
              : null;
            const endMoment = sessionObj.end_date
              ? moment(
                typeof sessionObj.end_date === 'number' || !isNaN(Number(sessionObj.end_date))
                  ? Number(sessionObj.end_date) * (Number(sessionObj.end_date) < 10000000000 ? 1000 : 1)
                  : sessionObj.end_date
              )
              : null;

            const diffMinutes = startMoment && endMoment ? endMoment.diff(startMoment, 'minutes') : 0;
            const durationDays = Math.floor(diffMinutes / 1440);
            const durationHours = Math.floor((diffMinutes % 1440) / 60);
            const durationMins = diffMinutes % 60;
            const durationText = diffMinutes > 0
              ? (durationDays > 0
                ? (durationHours > 0 && durationMins > 0
                  ? t('lc.sessionsSupport.sessionDetails.durationValueDaysHoursMinutes', { days: durationDays, hours: durationHours, minutes: durationMins })
                  : durationHours > 0
                    ? t('lc.sessionsSupport.sessionDetails.durationValueDaysHours', { days: durationDays, hours: durationHours })
                    : durationMins > 0
                      ? t('lc.sessionsSupport.sessionDetails.durationValueDaysMinutes', { days: durationDays, minutes: durationMins })
                      : t('lc.sessionsSupport.sessionDetails.durationValueDays', { count: durationDays }))
                : (durationHours > 0 && durationMins > 0
                  ? t('lc.sessionsSupport.sessionDetails.durationValueHoursMinutes', { hours: durationHours, minutes: durationMins })
                  : durationHours > 0
                    ? t('lc.sessionsSupport.sessionDetails.durationValueHours', { count: durationHours })
                    : t('lc.sessionsSupport.sessionDetails.durationValueMinutes', { count: durationMins })))
              : '';

            const rawDeliveryMode = (
              (typeof sessionObj.delivery_mode === 'object' ? sessionObj.delivery_mode?.value : sessionObj.delivery_mode) ||
              sessionObj.deliveryMode ||
              ''
            ).toLowerCase();
            const deliveryMode = rawDeliveryMode.includes('hybrid') ? 'hybrid' : (rawDeliveryMode.includes('online') || rawDeliveryMode.includes('virtual') ? 'online' : 'offline');

            const formatLabel = deliveryMode === 'online' ? 'Online' : deliveryMode === 'hybrid' ? 'Hybrid' : 'Offline';
            const formatIconName = deliveryMode === 'online' || deliveryMode === 'hybrid' ? 'Video' : 'MapPin';

            const totalSeats = sessionObj.seats_limit || sessionObj.capacity || 0;
            const remainingSeats = sessionObj.seats_remaining !== undefined ? sessionObj.seats_remaining : totalSeats;
            const enrolledSeats = Math.max(0, totalSeats - remainingSeats);

            const rawObjectives = sessionObj.learning_objectives || sessionObj.meta?.learning_objectives || sessionObj.learningObjectives;
            const learningObjectives = Array.isArray(rawObjectives)
              ? rawObjectives.filter(Boolean)
              : typeof rawObjectives === 'string' && rawObjectives.trim()
                ? rawObjectives.split('\n').map((line: string) => line.replace(/^[•\-*\s]+/, '').trim()).filter(Boolean)
                : [];

            setSession({
              ...sessionObj,
              mentorName: sessionObj.mentor_name || '', provinceName, linkValue,
              descriptionText,
              startMoment,
              endMoment,
              durationText,
              totalSeats,
              remainingSeats,
              enrolledSeats,
              deliveryMode,
              formatLabel,
              formatIconName,
              learningObjectives,
            });
          } else {
            setSession(null);
          }
        }
      } catch (err) {
        console.error('Error fetching session details:', err);
        if (isMounted) {
          showAlert('error', 'Failed to load session details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleConfirmAssignment = async (selectedIds: string[]): Promise<boolean> => {
    if (!session) return false;
    const id = session.id || session._id;
    try {
      await requestorAssignMenteesToSession(id, selectedIds);
      showAlert(
        'success',
        t(
          'lc.sessionsSupport.alerts.assignSuccess',
          {
            defaultValue: `${selectedIds.length} participant(s) assigned to session successfully.`,
            count: selectedIds.length
          }
        )
      );

      // Update local state instead of doing another API fetch to fulfill the "fetched ONLY ONCE" rule
      setSession((prev: any) => {
        if (!prev) return prev;
        const currentRemaining = prev.seats_remaining !== undefined ? prev.seats_remaining : (prev.seats_limit || prev.capacity || 0);
        const newRemaining = Math.max(0, currentRemaining - selectedIds.length);
        const newEnrolled = Math.max(0, prev.totalSeats - newRemaining);
        return {
          ...prev,
          seats_remaining: newRemaining,
          remainingSeats: newRemaining,
          enrolledSeats: newEnrolled,
        };
      });
      return true;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to assign participants to session.';
      showAlert('error', errMsg);
      return false;
    }
  };

  if (loading) {
    return <Loader fullScreen message="Loading..." />;
  }

  if (!session) {
    return (
      <Box {...styles.detailsScreenRoot}>
        <PageHeader
          backButtonText={t('common.backToSessions', 'Back to Sessions')}
          onBackPress={() => {
            navigation.navigate('sessions-support' as never);
          }}
          _backButton={styles.detailsHeaderBackButton}
        />
        <Box {...styles.detailsNotFoundContainer}>
          <Text color="$textMuted">{t('lc.sessionsSupport.sessionNotFound', 'Session not found.')}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box {...styles.detailsScreenRoot}>
      <PageHeader
        title={session.title}
        _title={styles.detailsHeaderTitle}
        subtitle={session.mentorName}
        _subtitle={styles.detailsHeaderSubtitle}
        backButtonText={t('lc.sessionsSupport.sessionDetails.backToSessions')}
        onBackPress={() => { navigation.navigate('sessions-support' as never) }}
        _leftSection={styles.detailsHeaderLeftSection}
        _backButton={styles.detailsHeaderBackButton}
      />

      <Container {...styles.detailsMainContainer}>
        <HStack {...styles.detailsLayoutWrapper}>
          {/* RIGHT COLUMN (Web): Session Details Metadata Info Card */}
          <VStack {...styles.detailsRightCol}>
            {/* About This Session */}
            {session.descriptionText ? (
              <Box {...styles.detailsContentCard}>
                <Text {...styles.detailsCardHeader}>
                  {t('lc.sessionsSupport.sessionDetails.aboutThisSession')}
                </Text>
                <Text {...styles.detailsCardBodyText}>{session.descriptionText}</Text>
              </Box>
            ) : null}

            {/* Learning Objectives */}
            {session.learningObjectives && session.learningObjectives.length > 0 ? (
              <Box {...styles.detailsContentCard}>
                <Text {...styles.detailsCardHeader}>
                  {t('lc.sessionsSupport.sessionDetails.learningObjectives')}
                </Text>
                <VStack>
                  {session.learningObjectives.map((obj: string, index: number) => (
                    <HStack key={index} {...styles.detailsLearningObjectiveItem}>
                      <Box {...styles.detailsLearningObjectiveBullet} bg="$primary500" />
                      <Text {...styles.detailsLearningObjectiveText}>{obj}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            ) : null}

            {/* Assign Participants */}
            <Box {...styles.detailsAssignBox}>
              <VStack {...styles.detailsAssignTextWrapper}>
                <HStack {...styles.detailsAssignHeaderHStack}>
                  <LucideIcon name="UserPlus" {...styles.detailsAssignIconProps} />
                  <Text {...styles.detailsAssignTitle}>
                    {t('lc.sessionsSupport.sessionDetails.assignParticipants')}
                  </Text>
                </HStack>
                <Text {...styles.detailsAssignSubtitle}>
                  {t('lc.sessionsSupport.sessionDetails.assignSubtitle')}
                </Text>
              </VStack>
              <Button
                variant="solid"
                {...styles.detailsAssignButton}
                onPress={() => setIsAssignModalOpen(true)}
              >
                <ButtonIcon as={LucideIcon} name="UserPlus" {...styles.detailsAssignIconProps1} />
                <ButtonText {...styles.detailsAssignButtonText}>
                  {t('lc.sessionsSupport.sessionDetails.assignParticipants')}
                </ButtonText>
              </Button>
            </Box>
          </VStack>

          {/* LEFT COLUMN (Web): Session Description/Content Cards */}
          <VStack {...styles.detailsLeftCol}>
            <VStack {...styles.detailsInfoCard}>
              {/* Date & Time */}
              <HStack {...styles.detailsInfoItem}>
                <Box {...styles.detailsDateTimeIconWrapper}>
                  <LucideIcon name="Calendar" {...styles.detailsDateTimeIconProps} />
                </Box>
                <VStack>
                  <Text {...styles.detailsDateTimeLabel}>
                    {t('lc.sessionsSupport.sessionDetails.dateTime')}
                  </Text>
                  <Text {...styles.detailsDateValue}>
                    {session.startMoment ? session.startMoment.format('dddd, D MMMM YYYY') : ''}
                  </Text>
                  <Text {...styles.detailsTimeValue}>
                    {session.startMoment ? session.startMoment.format('hh:mm A') : ''}
                  </Text>
                </VStack>
              </HStack>

              {/* Duration */}
              {session.durationText ? (
                <HStack {...styles.detailsInfoItem}>
                  <Box {...styles.detailsIconWrapper}>
                    <LucideIcon name="Clock" {...styles.detailsIconProps} />
                  </Box>
                  <VStack>
                    <Text {...styles.detailsItemLabel}>
                      {t('lc.sessionsSupport.sessionDetails.duration')}
                    </Text>
                    <Text {...styles.detailsItemValue}>{session.durationText}</Text>
                  </VStack>
                </HStack>
              ) : null}

              {/* Format */}
              <HStack {...styles.detailsInfoItem}>
                <Box {...styles.detailsIconWrapper}>
                  <LucideIcon name={session.formatIconName} {...styles.detailsIconProps} />
                </Box>
                <VStack>
                  <Text {...styles.detailsItemLabel}>
                    {t('lc.sessionsSupport.sessionDetails.format')}
                  </Text>
                  <Text {...styles.detailsItemValue}>{session.formatLabel}</Text>
                </VStack>
              </HStack>

              {/* Location (Show ONLY the Province name. Do NOT show Site.) */}
              {session.provinceName ? (
                <HStack {...styles.detailsInfoItem}>
                  <Box {...styles.detailsIconWrapper}>
                    <LucideIcon name="MapPin" {...styles.detailsIconProps} />
                  </Box>
                  <VStack>
                    <Text {...styles.detailsItemLabel}>
                      {t('lc.sessionsSupport.sessionDetails.location')}
                    </Text>
                    <Text {...styles.detailsItemValue}>{session.provinceName}</Text>
                  </VStack>
                </HStack>
              ) : null}

              {/* Virtual Link (Only render if online link is present) */}
              {(session.deliveryMode === 'online' || session.deliveryMode === 'hybrid') && session.linkValue ? (
                <Pressable onPress={() => openExternalLink(session.linkValue)}>
                  <HStack {...styles.detailsInfoItem}>
                    <Box {...styles.detailsIconWrapper}>
                      <LucideIcon name="Video" {...styles.detailsIconProps} />
                    </Box>
                    <VStack>
                      <Text {...styles.detailsItemLabel}>
                        {t('lc.sessionsSupport.sessionDetails.virtualLink')}
                      </Text>
                      <Text {...styles.detailsVirtualLinkText}>{session.linkValue}</Text>
                    </VStack>
                  </HStack>
                </Pressable>
              ) : null}

              {/* Capacity */}
              {session.totalSeats > 0 ? (
                <HStack {...styles.detailsInfoItem}>
                  <Box {...styles.detailsIconWrapper}>
                    <LucideIcon name="Users" {...styles.detailsIconProps} />
                  </Box>
                  <VStack>
                    <Text {...styles.detailsItemLabel}>
                      {t('lc.sessionsSupport.sessionDetails.capacity')}
                    </Text>
                    <Text {...styles.detailsCapacityText}>
                      {session.enrolledSeats} / {session.totalSeats} {t('lc.sessionsSupport.sessionDetails.enrolled')}
                    </Text>
                    <Text {...styles.detailsSpotsText}>
                      {session.remainingSeats} {t('lc.sessionsSupport.sessionDetails.spotsRemaining')}
                    </Text>
                  </VStack>
                </HStack>
              ) : null}
            </VStack>
          </VStack>
        </HStack>
      </Container>

      <AssignParticipantsModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        session={session}
        onConfirm={handleConfirmAssignment}
        maxSelectable={session?.seats_remaining}
      />
    </Box>
  );
};

export default SessionDetailsScreen;
