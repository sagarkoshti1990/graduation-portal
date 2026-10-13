import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Heading, Pressable } from '@gluestack-ui/themed';
import { Container, LucideIcon, useAlert } from '@ui';
import { theme } from '@config/theme';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { STATUS, USER_STATUS } from '@constants/app.constant';
import { PARTICIPANT_JOURNEY_CARDS } from '@constants/PARTICIPANT_JOURNEY_CARDS';
import dataService from '../../services/dataService';
import { getUserProfile } from '../../services/authenticationService';
import { participantJourneyStyles } from './Styles';
import { isWeb } from '@utils/platform';
import { getParticipantStatusMessage } from '@utils/participantJourneyUtils';

const IconBadge: React.FC<{
  name: string;
  bg: string;
  color: string;
  containerProps?: Record<string, any>;
}> = ({ name, bg, color, containerProps }) => (
  <Box {...participantJourneyStyles.iconBadge} {...containerProps} bg={bg}>
    <LucideIcon name={name} size={16} color={color} strokeWidth={2} />
  </Box>
);

const formatCoachContact = (contact?: string, phoneCode?: string) => {
  if (!contact) return '';
  let str = String(contact).trim();
  let code = phoneCode ? String(phoneCode).trim() : '';
  if (code) {
    if (!code.startsWith('+')) code = `+${code}`;
    if (!str.startsWith('+')) {
      if (str.startsWith(code.replace('+', ''))) {
        str = `+${str}`;
      } else {
        str = `${code} ${str}`;
      }
    }
    return str;
  }
  if (!str.startsWith('+') && /^\d{1,4}[\s-]?\d+/.test(str)) {
    return `+${str}`;
  }
  return str;
};

const ParticipantJourneyPortal: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(user?.status);
  const [accountUserStatus, setAccountUserStatus] = useState<string | undefined>((user as any)?.accountUserStatus);
  const [coachDetails, setCoachDetails] = useState<{ name?: string; contact?: string }>({
    name: user?.coachName,
    contact: formatCoachContact(user?.coachContact),
  });

  const coachName = coachDetails.name || user?.coachName || '';
  const coachContact = coachDetails.contact || formatCoachContact(user?.coachContact) || '';

  const fetchedRef = React.useRef<string>('');

  useEffect(() => {
    const participantId = (user as any)?.externalId || (user as any)?.userId || user?.id || '';
    const authUserId = user?.id || '';
    const fetchKey = `${participantId}_${authUserId}`;

    if (user?.status) {
      setCurrentStatus(user.status);
    }
    if ((user as any)?.accountUserStatus) {
      setAccountUserStatus((user as any).accountUserStatus);
    }

    if (participantId && authUserId && fetchedRef.current !== fetchKey) {
      fetchedRef.current = fetchKey;
      dataService.getParticipantDetails(participantId, authUserId)
        .then(async result => {
          const pData = result?.data;
          if (pData?.status) {
            setCurrentStatus(pData.status);
          }
          if (pData?.accountUserStatus) {
            setAccountUserStatus(pData.accountUserStatus);
          }
          const coachId = pData?.hierarchy?.['0'] || pData?.hierarchy?.[0];
          if (coachId) {
            try {
              const coachProfile = await getUserProfile(String(coachId));
              if (coachProfile) {
                const name = coachProfile.name || `${coachProfile.firstName || ''} ${coachProfile.lastName || ''}`.trim() || '';
                const phoneCode = coachProfile.phone_code ? String(coachProfile.phone_code).trim() : '';
                let contact = coachProfile.phone || coachProfile.contact || coachProfile.alternative_phone || '';
                contact = formatCoachContact(contact, phoneCode);
                setCoachDetails({ name, contact });
              }
            } catch {
              // Fail silently
            }
          }
        })
        .catch(err => {
          fetchedRef.current = '';
          const msg = err?.response?.data?.message || err?.message;
          if (msg) {
            showAlert('error', msg);
          }
        });
    }
  }, [user?.id, (user as any)?.externalId, (user as any)?.userId]);

  const DISABLEABLE_CARD_IDS = ['idp-progress', 'sessions', 'graduation'];
  const normalizedStatus = (currentStatus || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
  const normalizedAccountStatus = (accountUserStatus || '').toString().trim().toUpperCase().replace(/\s+/g, '_');
  const shouldDisableCards =
    normalizedStatus === STATUS.NOT_ONBOARDED ||
    normalizedStatus === STATUS.ONBOARDED ||
    normalizedStatus === STATUS.DROPOUT ||
    normalizedStatus === STATUS.NOT_ELIGIBLE ||
    normalizedStatus === USER_STATUS.INACTIVE ||
    normalizedAccountStatus === USER_STATUS.INACTIVE;

  const statusMessage = getParticipantStatusMessage(currentStatus, accountUserStatus);

  const handleCardPress = (card: any) => {
    if (card.variant === 'link' && card.navigationUrl) {
      // @ts-ignore
      navigation.navigate(card.navigationUrl);
    }
  };

  const renderCardContent = (card: any) => {
    if (card.variant === 'coach') {
      return (
        <VStack {...participantJourneyStyles.coachCardContent}>
          {card.rows.map((row: any) => {
            const isNameRow = row.id === 'coach-name';
            const value = isNameRow ? coachName : coachContact;
            const rowStyle = isNameRow
              ? participantJourneyStyles.coachRowFirstName
              : participantJourneyStyles.coachRow;

            return (
              <HStack key={row.id} {...rowStyle}>
                <IconBadge name={row.icon} bg={row.iconBg} color={row.iconColor} />
                <VStack {...participantJourneyStyles.coachText}>
                  <Text {...participantJourneyStyles.coachLabel}>{t(row.label)}</Text>
                  <Text {...participantJourneyStyles.coachValue}>{value || ''}</Text>
                </VStack>
              </HStack>
            );
          })}
        </VStack>
      );
    }

    return (
      <VStack {...participantJourneyStyles.linkCardContent}>
        <IconBadge
          name={card.icon}
          bg={card.iconBg}
          color={card.iconColor}
          containerProps={participantJourneyStyles.linkIconBadge}
        />
        <VStack {...participantJourneyStyles.textContainer}>
          <Text {...participantJourneyStyles.cardTitle}>{t(card.title)}</Text>
          <Text {...participantJourneyStyles.cardDescription}>
            {t(card.description)}
          </Text>
        </VStack>
      </VStack>
    );
  };

  return (
    <Box {...participantJourneyStyles.page}>
      <Container {...participantJourneyStyles.container}>
        <VStack {...participantJourneyStyles.content}>
          <VStack {...participantJourneyStyles.header}>
            <Heading {...participantJourneyStyles.title}>
              {t('participantJourney.title')}
            </Heading>
            <Text {...participantJourneyStyles.welcome}>
              {user?.name
                ? t('participantJourney.welcomeBackNamed', { name: user.name })
                : t('participantJourney.welcomeBack')}
            </Text>
            {statusMessage && (
              <Text color="$warning700" fontSize="$sm" fontWeight="$medium" mt="$1">
                {statusMessage}
              </Text>
            )}
          </VStack>

          <Box {...participantJourneyStyles.cardsGrid}>
            {PARTICIPANT_JOURNEY_CARDS.map(card => {
              const isHovered = hoveredCardId === card.id;
              const isCardDisabled =
                DISABLEABLE_CARD_IDS.includes(card.id) && shouldDisableCards;
              const hoverBorderColor = card.hoverBorderColor || card.iconColor;
              const hoverBg = card.hoverBg || '$white';

              return (
                <Box key={card.id} {...participantJourneyStyles.cardColumn}>
                  <Pressable
                    {...participantJourneyStyles.pressableCard}
                    disabled={isCardDisabled}
                    onPress={() => {
                      if (!isCardDisabled) {
                        handleCardPress(card);
                      }
                    }}
                    {...(isWeb && !isCardDisabled && {
                      onHoverIn: () => setHoveredCardId(card.id),
                      onHoverOut: () => setHoveredCardId(null),
                    })}
                  >
                    <Box
                      {...(card.variant === 'coach'
                        ? participantJourneyStyles.coachCardBox
                        : {
                          ...participantJourneyStyles.cardBox,
                          ...(isCardDisabled ? { opacity: 0.5 } : {}),
                          ...(isHovered && !isCardDisabled
                            ? { borderColor: hoverBorderColor, bg: hoverBg }
                            : {}),
                        })}
                    >
                      {renderCardContent(card)}
                    </Box>
                  </Pressable>
                </Box>
              );
            })}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default ParticipantJourneyPortal;
