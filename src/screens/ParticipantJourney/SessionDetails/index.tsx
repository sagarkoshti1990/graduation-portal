import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Heading, Pressable } from '@gluestack-ui/themed';
import { Container, LucideIcon, Loader, useAlert } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { isWeb } from '@utils/platform';
import { getSessionDetails } from '../../../services/participantJourneyService';
import { getProvincesList } from '../../../services/usersService';
import {
  formatSessionStartDateTimeParts,
  calculateSessionDuration,
  getDeliveryMode,
  resolveProvinceNames,
} from '@utils/participantJourneyUtils';

interface SessionDisplayData {
  title: string;
  mentorName: string;
  dateStr: string;
  timeStr: string;
  durationStr: string;
  modeStr: string;
  provinceStr: string;
  enrolledText: string;
  spotsRemainingText: string;
  aboutContent: string;
  learningObjectives: string[];
  tags: string[];
}

const SessionDetailsScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute();
  const { showAlert } = useAlert();
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionDisplay, setSessionDisplay] = useState<SessionDisplayData | null>(null);

  const routeParams = (route.params as any) || {};
  const sessionId = String(routeParams.sessionId || routeParams.id || '').trim();

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const provincesList = await getProvincesList().catch(() => []);
        const detailsRes = await getSessionDetails(sessionId);

        if (!isMounted) return;

        const provinceMap: Record<string, string> = {};
        if (Array.isArray(provincesList)) {
          provincesList.forEach((p: any) => {
            if (p._id && p.name) provinceMap[p._id] = p.name;
            if (p.id && p.name) provinceMap[p.id] = p.name;
            if (p.externalId && p.name) provinceMap[p.externalId] = p.name;
          });
        }

        const item = detailsRes?.result?.data || detailsRes?.result || detailsRes?.data || detailsRes || {};

        const title = item.title || item.name || item.label || '';
        const mentorName = item.mentor_name || item.mentorName || item.provider || item.serviceProvider || item.organization || '';

        const { date: dateStr, time: timeStr } = formatSessionStartDateTimeParts(item);
        const durationStr = calculateSessionDuration(item);
        const modeStr = getDeliveryMode(item);

        const rawProvince = item.meta?.provinces || item.meta?.province || item.province || item.provinces || item.location || item.venue || '';
        const provinceStr = resolveProvinceNames(rawProvince, provinceMap);

        const seatsLimit = item.seats_limit ?? item.seatsLimit ?? item.capacity ?? item.maxCapacity;
        const seatsRemaining = item.seats_remaining ?? item.seatsRemaining;

        let enrolledText = '';
        if (seatsLimit !== undefined && seatsLimit !== null && seatsLimit !== '') {
          if (seatsRemaining !== undefined && seatsRemaining !== null && seatsRemaining !== '') {
            const enrolled = item.enrolled_count ?? item.enrolledCount ?? (Number(seatsLimit) - Number(seatsRemaining));
            enrolledText = `${enrolled} / ${seatsLimit} enrolled`;
          } else {
            enrolledText = `${seatsLimit} enrolled`;
          }
        }

        let spotsRemainingText = '';
        if (seatsRemaining !== undefined && seatsRemaining !== null && seatsRemaining !== '') {
          spotsRemainingText = `${seatsRemaining} spots remaining`;
        }

        const aboutContent = item.description || item.about || item.meta?.description || '';

        const rawObjectives = item.learning_objectives ?? item.learningObjectives ?? item.meta?.learning_objectives;
        let learningObjectives: string[] = [];
        if (Array.isArray(rawObjectives)) {
          learningObjectives = rawObjectives.map((o: any) => (typeof o === 'string' ? o : o.title || o.name || String(o))).filter(Boolean);
        } else if (typeof rawObjectives === 'string' && rawObjectives.trim()) {
          learningObjectives = rawObjectives.split('\n').map((s: string) => s.trim()).filter(Boolean);
        }

        const tags = Array.isArray(item.tags) ? item.tags : [];

        setSessionDisplay({
          title,
          mentorName,
          dateStr,
          timeStr,
          durationStr,
          modeStr,
          provinceStr,
          enrolledText,
          spotsRemainingText,
          aboutContent,
          learningObjectives,
          tags,
        });
      } catch (err: any) {
        console.error('Failed to load session details:', err);
        const msg = err?.response?.data?.message || err?.message;
        if (msg) {
          showAlert('error', msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore
      navigation.navigate('my-sessions');
    }
  };

  if (isLoading) {
    return (
      <Box flex={1} bg="$accent100" justifyContent="center" alignItems="center" py="$10">
        <Loader />
      </Box>
    );
  }

  const {
    title = '',
    mentorName = '',
    dateStr = '',
    timeStr = '',
    durationStr = '',
    modeStr = '',
    provinceStr = '',
    enrolledText = '',
    spotsRemainingText = '',
    aboutContent = '',
    learningObjectives = [],
    tags = [],
  } = sessionDisplay || {};

  return (
    <Box flex={1} bg="$accent100">
      {/* Top Header Bar */}
      <Box width="$full" bg="$white" borderBottomWidth={1} borderColor="$inputBorder">
        <Container width="$full" px="$6" py="$4" $md-px="$8">
          <VStack space="md">
            {/* Back Button */}
            <Pressable
              onPress={handleBack}
              {...(isWeb && {
                onHoverIn: () => setIsBackHovered(true),
                onHoverOut: () => setIsBackHovered(false),
              })}
              accessibilityRole="button"
              accessibilityLabel={t('participantJourney.backToSessions') || 'Back to Sessions'}
              alignSelf="flex-start"
              borderRadius="$md"
            >
              <HStack
                alignItems="center"
                space="sm"
                px="$2"
                py="$1"
                borderRadius="$md"
                bg={isBackHovered ? '$primary100' : 'transparent'}
              >
                <LucideIcon
                  name="ArrowLeft"
                  size={16}
                  color={isBackHovered ? '$primary500' : '$textDark900'}
                  strokeWidth={1.5}
                />
                <Text
                  fontSize="$sm"
                  fontWeight="$medium"
                  color={isBackHovered ? '$primary500' : '$textDark900'}
                >
                  {t('participantJourney.backToSessions') || 'Back to Sessions'}
                </Text>
              </HStack>
            </Pressable>

            {/* Header: Title & Mentor Name */}
            {(title || mentorName) ? (
              <VStack space="xs">
                {title ? (
                  <Heading fontSize="$2xl" fontWeight="$bold" color="$textDark900">
                    {title}
                  </Heading>
                ) : null}
                {mentorName ? (
                  <Text fontSize="$md" color="$textDark600">
                    {mentorName}
                  </Text>
                ) : null}
              </VStack>
            ) : null}
          </VStack>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container width="$full" px="$6" py="$6" $md-px="$8" $md-py="$8">
        <VStack space="lg" width="$full">
          {/* Session Info Card */}
          <Box bg="$white" borderWidth={1} borderColor="$inputBorder" borderRadius="$xl" p="$5">
            <VStack space="md">
              {/* Date & Time */}
              {dateStr ? (
                <HStack space="md" alignItems="flex-start">
                  <Box p="$2.5" bg="#FEF3C7" borderRadius="$lg" alignItems="center" justifyContent="center">
                    <LucideIcon name="Calendar" size={18} color="#D97706" strokeWidth={2} />
                  </Box>
                  <VStack space="xs">
                    <Text fontSize="$xs" color="$textDark500" fontWeight="$medium">
                      Date & Time
                    </Text>
                    <Text fontSize="$sm" fontWeight="$normal" color="$textDark900">
                      {dateStr}
                    </Text>
                    {timeStr ? (
                      <Text fontSize="$sm" fontWeight="$normal" color="$textDark900">
                        {timeStr}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>
              ) : null}

              {/* Duration */}
              {durationStr ? (
                <HStack space="md" alignItems="flex-start">
                  <Box p="$2.5" bg="#FEF3C7" borderRadius="$lg" alignItems="center" justifyContent="center">
                    <LucideIcon name="Clock" size={18} color="#D97706" strokeWidth={2} />
                  </Box>
                  <VStack space="xs">
                    <Text fontSize="$xs" color="$textDark500" fontWeight="$medium">
                      Duration
                    </Text>
                    <Text fontSize="$sm" fontWeight="$semibold" color="$textDark900">
                      {durationStr}
                    </Text>
                  </VStack>
                </HStack>
              ) : null}

              {/* Format (with Province underneath) */}
              {modeStr ? (
                <HStack space="md" alignItems="flex-start">
                  <Box p="$2.5" bg="#FEF3C7" borderRadius="$lg" alignItems="center" justifyContent="center">
                    <LucideIcon name="Building" size={18} color="#D97706" strokeWidth={2} />
                  </Box>
                  <VStack space="xs">
                    <Text fontSize="$xs" color="$textDark500" fontWeight="$medium">
                      Format
                    </Text>
                    <Text fontSize="$sm" fontWeight="$semibold" color="$textDark900">
                      {modeStr}
                    </Text>
                    {provinceStr ? (
                      <HStack alignItems="center" space="xs" mt="$1">
                        <LucideIcon name="MapPin" size={14} color="$textDark600" />
                        <Text fontSize="$xs" color="$textDark600">
                          {provinceStr}
                        </Text>
                      </HStack>
                    ) : null}
                  </VStack>
                </HStack>
              ) : null}

              {/* Capacity */}
              {enrolledText ? (
                <HStack space="md" alignItems="flex-start">
                  <Box p="$2.5" bg="#FEF3C7" borderRadius="$lg" alignItems="center" justifyContent="center">
                    <LucideIcon name="Users" size={18} color="#D97706" strokeWidth={2} />
                  </Box>
                  <VStack space="xs">
                    <Text fontSize="$xs" color="$textDark500" fontWeight="$medium">
                      Capacity
                    </Text>
                    <Text fontSize="$sm" fontWeight="$semibold" color="$textDark900">
                      {enrolledText}
                    </Text>
                    {spotsRemainingText ? (
                      <Text fontSize="$xs" color="$success600" fontWeight="$medium">
                        {spotsRemainingText}
                      </Text>
                    ) : null}
                  </VStack>
                </HStack>
              ) : null}

              {/* Tags */}
              {tags.length > 0 ? (
                <HStack flexWrap="wrap" gap="$2" mt="$2">
                  {tags.map((tag: string, idx: number) => (
                    <Box key={idx} px="$3" py="$1" borderRadius="$full" borderWidth={1} borderColor="$inputBorder" bg="$white">
                      <Text fontSize="$xs" color="$textDark900" fontWeight="$medium">
                        {tag}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              ) : null}
            </VStack>
          </Box>

          {/* About This Session */}
          {aboutContent ? (
            <Box bg="$white" borderWidth={1} borderColor="$inputBorder" borderRadius="$xl" p="$5">
              <VStack space="sm">
                <Heading fontSize="$md" fontWeight="$bold" color="$textDark900">
                  About This Session
                </Heading>
                <Text fontSize="$sm" color="$textDark700" lineHeight="$md">
                  {aboutContent}
                </Text>
              </VStack>
            </Box>
          ) : null}

          {/* Learning Objectives */}
          {learningObjectives.length > 0 ? (
            <Box bg="$white" borderWidth={1} borderColor="$inputBorder" borderRadius="$xl" p="$5">
              <VStack space="sm">
                <Heading fontSize="$md" fontWeight="$bold" color="$textDark900">
                  Learning Objectives
                </Heading>
                <VStack space="xs" mt="$1">
                  {learningObjectives.map((obj: string, idx: number) => (
                    <HStack key={idx} alignItems="flex-start" space="xs">
                      <Text fontSize="$sm" color="$primary500" fontWeight="$bold">•</Text>
                      <Text fontSize="$sm" color="$textDark700" flex={1}>
                        {obj}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </Box>
          ) : null}
        </VStack>
      </Container>
    </Box>
  );
};

export default SessionDetailsScreen;
