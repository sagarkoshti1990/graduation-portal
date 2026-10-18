import React, { useState, useEffect } from 'react';
import { Box, HStack, VStack, Text, Loader, LucideIcon, Container, Badge, BadgeText, Pressable } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import PageHeader from '@components/PageHeader';
import moment from 'moment';
import openExternalLink from '@utils/openExternalLink';
import { getRequestSessionDetails } from '../../../services/serviceProvider/serviceProviderService';
import { getProvincesList } from '../../../services/usersService';
import styles from './styles';
import sessionStyles from '../styles';

const getStatusBadgeStyles = (status: string, t: any) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('complete')) {
    return {
      bg: '$green50',
      borderColor: '$green200',
      color: '$green600',
      icon: 'CheckCircle2',
      label: t('lc.sessionsSupport.requestDetails.statusCompleted', 'Completed'),
    };
  }
  if (normalized.includes('accept') || normalized.includes('publish') || normalized.includes('approved') || normalized.includes('live')) {
    return {
      bg: '$green50',
      borderColor: '$green200',
      color: '$green600',
      icon: 'CheckCircle2',
      label: t('lc.sessionsSupport.requestDetails.statusAccepted', 'Accepted'),
    };
  }
  if (normalized.includes('decline') || normalized.includes('reject')) {
    return {
      bg: '$red50',
      borderColor: '$red200',
      color: '$red600',
      icon: 'XCircle',
      label: t('lc.sessionsSupport.requestDetails.statusDeclined', 'Declined'),
    };
  }
  return {
    bg: '$yellow50',
    borderColor: '$yellow200',
    color: '$amber600',
    icon: 'Clock',
    label: status ? t(`lc.sessionsSupport.requestDetails.status_${status.toLowerCase()}`, status) : t('lc.sessionsSupport.requestDetails.statusRequested', 'Requested'),
  };
};

const displayValue = (val: any) => {
  if (val == null) return '-';
  if (typeof val === 'object') {
    return val.label || val.name || val.value || JSON.stringify(val);
  }
  return String(val);
};

const parseMoment = (val: any) => {
  if (!val) return null;
  const num = Number(val);
  const parsedVal = typeof val === 'number' || !isNaN(num)
    ? num * (num < 10000000000 ? 1000 : 1)
    : val;
  const m = moment(parsedVal);
  return m.isValid() ? m : null;
};

const formatDateTime = (val: any, t: any) => {
  const m = parseMoment(val);
  return m ? t('lc.sessionsSupport.requestDetails.dateTimeFormat', '{{date}} at {{time}}', { date: m.format('YYYY-MM-DD'), time: m.format('hh:mm A') }) : '-';
};

const formatDate = (val: any) => {
  const m = parseMoment(val);
  return m ? m.format('YYYY-MM-DD') : '-';
};

export const RequestDetailsScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute() as any;

  const { requestId, statusOverride } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [requestItem, setRequestItem] = useState<any>(null);
  const [mappedSessionDetails, setMappedSessionDetails] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (!requestId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [res, provincesData] = await Promise.all([
          getRequestSessionDetails(requestId),
          getProvincesList().catch(() => [])
        ]);
        if (isMounted) {
          // getDetails returns a single request record (possibly wrapped in `data`)
          const found = res?.data && !res.session && !res.session_details ? res.data : res;
          if (found) {
            setRequestItem(found);
            const sessionObj = found.session || found.session_details || {};
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

            const sessionTags = Array.from(
              new Set([
                ...(Array.isArray(sessionObj.categories) ? sessionObj.categories : []).map((c: any) => (typeof c === 'object' ? c.label || c.name || c.value : c)),
                ...(Array.isArray(sessionObj.tags) ? sessionObj.tags : []).map((tg: any) => (typeof tg === 'object' ? tg.label || tg.name || tg.value : tg)),
                ...(Array.isArray(sessionObj.pathways) ? sessionObj.pathways : []).map((p: any) => (typeof p === 'object' ? p.label || p.name || p.value : p)),
                'Participants',
              ])
            ).filter(Boolean);

            const rawObjectives = sessionObj.learning_objectives || sessionObj.meta?.learning_objectives || sessionObj.learningObjectives;
            const learningObjectives = Array.isArray(rawObjectives)
              ? rawObjectives.filter(Boolean)
              : typeof rawObjectives === 'string' && rawObjectives.trim()
                ? rawObjectives.split('\n').map((line: string) => line.replace(/^[•\-*\s]+/, '').trim()).filter(Boolean)
                : [];

            setMappedSessionDetails({
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
              sessionTags,
              learningObjectives,
            });
          } else {
            setRequestItem(null);
            setMappedSessionDetails(null);
          }
        }
      } catch (err) {
        console.error('Error fetching request details:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [requestId, t]);

  if (loading) {
    return <Loader fullScreen message={t('loading', 'Loading...')} />;
  }

  if (!requestItem) {
    return (
      <Box {...styles.detailsScreenRoot}>
        <PageHeader
          onBackPress={() => {
            navigation.navigate('sessions-support' as never);
          }}
          _backButton={styles.detailsHeaderBackButton}
        />
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="$textMuted">{t('lc.sessionsSupport.requestDetails.notFound', 'Request not found.')}</Text>
        </Box>
      </Box>
    );
  }

  const sessionObj = requestItem.session || requestItem.session_details || {};
  const statusStyle = getStatusBadgeStyles(statusOverride || requestItem.status, t);
  const requestedDateStr = formatDate(requestItem.created_at || requestItem.createdAt || requestItem.requested_at);
  const mentorName = requestItem.mentor_name || sessionObj.mentor_name || requestItem.mentorName || '-';

  const notesText = sessionObj.description || requestItem.description || requestItem.agenda || '';
  const extraInformation: string = requestItem.meta?.extra_information || '';

  const pillar = displayValue(sessionObj.category || requestItem.category || requestItem.pillar);
  const trainingArea = displayValue(sessionObj.title || requestItem.title || requestItem.training_session);
  const description = displayValue(sessionObj.description || requestItem.description || requestItem.agenda);
  const targetAudience = displayValue(sessionObj.recommended_for || requestItem.target_audience || t('lc.sessionsSupport.requestDetails.participant', 'Participant'));

  const hasCertificate = sessionObj.certificate_provided || requestItem.certificate_provided;
  const certificate = hasCertificate ? t('lc.sessionsSupport.requestDetails.yes', 'Yes') : t('lc.sessionsSupport.requestDetails.no', 'No');

  const maxCapacity = displayValue(sessionObj.seats_limit || requestItem.seats_limit || requestItem.max_capacity);
  const startDateTime = formatDateTime(sessionObj.start_date || requestItem.start_date || requestItem.start_date_time, t);
  const endDateTime = formatDateTime(sessionObj.end_date || requestItem.end_date || requestItem.end_date_time, t);
  const formatVal = displayValue(sessionObj.delivery_mode || requestItem.delivery_mode || requestItem.format);
  const venueVal = displayValue(sessionObj.meeting_info?.location || sessionObj.location || requestItem.venue || requestItem.meeting_link);

  return (
    <Box {...styles.detailsScreenRoot}>
      <PageHeader
        title={t('lc.sessionsSupport.requestDetails.title', 'Request Details')}
        _title={styles.detailsHeaderTitle}
        subtitle={t('lc.sessionsSupport.requestDetails.idLabel', { defaultValue: 'ID: {{id}}', id: requestId })}
        _subtitle={styles.detailsHeaderSubtitle}
        onBackPress={() => {
          navigation.navigate('sessions-support' as never);
        }}
        _backButton={styles.detailsHeaderBackButton}
      />

      <Container {...styles.detailsMainContainer}>
        <HStack {...sessionStyles.detailsLayoutWrapper}>
          {/* LEFT COLUMN: Request overview details & Submitted Info */}
          <VStack {...sessionStyles.detailsRightCol}>
            {/* Card 1: Request overview details */}
            <Box {...styles.detailsCard}>
              <Box {...styles.detailsCardBanner}>
                <Box {...styles.statusHeaderRow}>
                  <VStack space="xs">
                    <Text {...styles.statusLabelText}>
                      {t('lc.sessionsSupport.requestDetails.statusLabel', 'STATUS')}
                    </Text>
                    <Box
                      {...styles.statusBadge}
                      borderColor={statusStyle.borderColor}
                      bg={statusStyle.bg}
                    >
                      <LucideIcon name={statusStyle.icon} size={14} color={statusStyle.color} />
                      <BadgeText
                        {...styles.statusBadgeText}
                        color={statusStyle.color}
                      >
                        {statusStyle.label}
                      </BadgeText>
                    </Box>
                  </VStack>

                  <VStack space="xs" alignItems="flex-end">
                    <Text {...styles.statusLabelText}>
                      {t('lc.sessionsSupport.requestDetails.requestedOnLabel', 'REQUESTED ON')}
                    </Text>
                    <Text {...styles.requestedOnText}>
                      {requestedDateStr}
                    </Text>
                  </VStack>
                </Box>
              </Box>

              <Box {...styles.detailsCardContent}>
                <Box {...styles.metaGridRow}>
                  <VStack {...styles.metaItem}>
                    <Text {...styles.metaLabel}>
                      {t('lc.sessionsSupport.requestDetails.typeLabel', 'Type')}
                    </Text>
                    <Text {...styles.metaValue}>
                      {t('lc.sessionsSupport.requestDetails.sessionType', 'Session')}
                    </Text>
                  </VStack>

                  <VStack {...styles.metaItem}>
                    <Text {...styles.metaLabel}>
                      {t('lc.sessionsSupport.requestDetails.providerLabel', 'Provider')}
                    </Text>
                    <Text {...styles.metaValue}>
                      {displayValue(mentorName)}
                    </Text>
                  </VStack>
                </Box>

                <VStack space="xs" mb="$5">
                  <Text {...styles.metaLabel}>
                    {t('lc.sessionsSupport.requestDetails.titleLabel', 'Title')}
                  </Text>
                  <Text {...styles.titleText}>
                    {requestItem.title}
                  </Text>
                </VStack>

                <VStack space="xs" width="100%">
                  <Text {...styles.notesHeader}>
                    {t('lc.sessionsSupport.requestDetails.notesUpdatesLabel', 'Notes / Updates')}
                  </Text>
                  <Box {...styles.notesBox}>
                    <Text {...styles.notesText}>
                      {notesText || '-'}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Box>

            {/* Additional information the Support Provider asked for about this request */}
            {extraInformation ? (
              <Box {...styles.detailsCard}>
                <Box {...styles.detailsCardBanner}>
                  <Text {...styles.infoCardHeader}>
                    {t('lc.sessionsSupport.requestDetails.infoRequestedLabel', 'Information Requested by Provider')}
                  </Text>
                </Box>
                <Box {...styles.detailsCardContent}>
                  <Box {...styles.notesBox}>
                    <Text {...styles.notesText}>{extraInformation}</Text>
                  </Box>
                </Box>
              </Box>
            ) : null}

            {/* Card 2: Submitted Information */}
            <Box {...styles.detailsCard}>
              <Box {...styles.detailsCardBanner}>
                <Text {...styles.infoCardHeader}>
                  {t('lc.sessionsSupport.requestDetails.submittedInfoLabel', 'Submitted Information')}
                </Text>
              </Box>

              <Box {...styles.detailsCardContent}>
                <VStack width="100%">
                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.pillarLabel', 'Pillar')}
                    </Text>
                    <Text {...styles.infoRowValue}>{pillar}</Text>
                  </Box>

                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.trainingSessionLabel', 'Training / Session')}
                    </Text>
                    <Text {...styles.infoRowValue}>{trainingArea}</Text>
                  </Box>

                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.descriptionLabel', 'Description')}
                    </Text>
                    <Text {...styles.infoRowValue}>{description}</Text>
                  </Box>

                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.targetAudienceLabel', 'Target Audience')}
                    </Text>
                    <Text {...styles.infoRowValue}>{targetAudience}</Text>
                  </Box>

                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.certificateProvidedLabel', 'Certificate Provided')}
                    </Text>
                    <Text {...styles.infoRowValue}>{certificate}</Text>
                  </Box>

                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.maxCapacityLabel', 'Max Capacity')}
                    </Text>
                    <Text {...styles.infoRowValue}>{maxCapacity}</Text>
                  </Box>

                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.startDateLabel', 'Start Date & Time')}
                    </Text>
                    <Text {...styles.infoRowValue}>{startDateTime}</Text>
                  </Box>

                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.endDateLabel', 'End Date & Time')}
                    </Text>
                    <Text {...styles.infoRowValue}>{endDateTime}</Text>
                  </Box>

                  <Box {...styles.infoRow}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.formatLabel', 'Format')}
                    </Text>
                    <Text {...styles.infoRowValue}>{formatVal}</Text>
                  </Box>

                  <Box {...styles.infoRowLast}>
                    <Text {...styles.infoRowLabel}>
                      {t('lc.sessionsSupport.requestDetails.venueLabel', 'Venue')}
                    </Text>
                    <Text {...styles.infoRowValue}>{venueVal}</Text>
                  </Box>
                </VStack>
              </Box>
            </Box>
          </VStack>
        </HStack>
      </Container>
    </Box>
  );
};

export default RequestDetailsScreen;
