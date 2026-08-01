import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
} from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
import ActionButtons from './FooterButtons';
import CardBadges from './CardBadges';
import cardStyles from '../../styles';
import { useLanguage } from '@contexts/LanguageContext';

const BASE_PATH = 'supportProvider.supportRequests';

interface DeclinedRequestItem {
  id: string | number;
  title: string;
  coach: string;
  hub?: string;
  requestedDate?: string;
  overdueDays?: number;
  status: string;
  participants?: number;
  location?: string;
  declineReason?: string;
  declineDetails?: string;
}

interface CardProps {
  item: DeclinedRequestItem;
  onViewFullDetails?: () => void;
}

function Card({ item, onViewFullDetails }: CardProps) {
  const { t } = useLanguage();
  return (
    <Box {...cardStyles.cardContainer}>
      {/* Top Header Row */}
      <HStack {...cardStyles.cardHeaderRow}>
        {/* Left Side: Title & Sub-metadata */}
        <VStack {...cardStyles.cardTitleCol}>
          <HStack {...cardStyles.cardTitleRow}>
            <LucideIcon name="XCircle" color="$red500" size={20} />
            <Text {...cardStyles.cardTitleText}>
              {item?.title}
            </Text>
          </HStack>

          {/* Sub Metadata Row */}
          <HStack {...cardStyles.cardSubMetaRow}>
            {item?.coach ? (
              <HStack {...cardStyles.cardSubMetaItem}>
                <LucideIcon name="Users" {...cardStyles.iconSubMeta} />
                <Text {...cardStyles.cardSubMetaText}>
                  {item.coach}
                </Text>
              </HStack>
            ) : null}

            {item?.hub ? (
              <HStack {...cardStyles.cardSubMetaItem}>
                <LucideIcon name="Building2" {...cardStyles.iconSubMeta} />
                <Text {...cardStyles.cardSubMetaText}>
                  {item.hub}
                </Text>
              </HStack>
            ) : null}

            {item?.requestedDate ? (
              <HStack {...cardStyles.cardSubMetaItem}>
                <LucideIcon name="Calendar" {...cardStyles.iconSubMeta} />
                <Text {...cardStyles.cardSubMetaText}>
                  {t(`${BASE_PATH}.labels.requestedDate`)} {item.requestedDate}
                </Text>
              </HStack>
            ) : null}
          </HStack>
        </VStack>

        {/* Right Side: Badges */}
        <CardBadges overdueDays={item?.overdueDays} status={item?.status || 'Declined'} />
      </HStack>

      {/* Middle Light-Gray Detail Box */}
      <Box {...cardStyles.detailBox}>
        <HStack {...cardStyles.cardDetailRow}>
          {/* Left Column */}
          <VStack {...cardStyles.cardDetailCol}>
            {item?.participants ? (
              <HStack {...cardStyles.cardSubMetaItem}>
                <LucideIcon name="Users" {...cardStyles.iconDetailBold} />
                <Text {...cardStyles.cardDetailBoldText}>
                  {item.participants} {t(`${BASE_PATH}.labels.participants`).toLowerCase()}
                </Text>
              </HStack>
            ) : null}
            {item?.declineReason ? (
              <HStack {...cardStyles.cardSubMetaItem}>
                <Text fontSize="$xs" fontWeight="$bold" color="$red600">
                  {t(`${BASE_PATH}.labels.reasonDetails`, 'Reason')}: {item.declineReason}
                </Text>
              </HStack>
            ) : null}
          </VStack>

          {/* Right Column */}
          <VStack {...cardStyles.cardDetailCol}>
            {item?.location ? (
              <HStack {...cardStyles.cardSubMetaItem}>
                <LucideIcon name="MapPin" {...cardStyles.iconDetailText} />
                <Text {...cardStyles.cardDetailText}>
                  {item.location}
                </Text>
              </HStack>
            ) : null}
          </VStack>
        </HStack>
      </Box>

      {/* Bottom Footer Actions - Only View Full Details */}
      <ActionButtons
        onViewFullDetails={onViewFullDetails}
      />
    </Box>
  );
}

interface DeclinedCardProps {
  items?: any[];
  onViewFullDetails?: (item: any) => void;
}

export default function DeclinedCard({
  items = [],
  onViewFullDetails,
}: DeclinedCardProps): React.ReactElement {
  if (!items || items.length === 0) {
    return (
      <Box p="$8" alignItems="center" justifyContent="center">
        <Text color="$gray500" fontSize="$sm">
          No declined requests found.
        </Text>
      </Box>
    );
  }

  return (
    <VStack {...cardStyles.cardListContainer}>
      {items.map((item) => (
        <Card
          key={item.id}
          item={item}
          onViewFullDetails={() => onViewFullDetails?.(item)}
        />
      ))}
    </VStack>
  );
}
