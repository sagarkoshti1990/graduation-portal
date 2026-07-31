import React from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import LucideIcon from '@components/ui/LucideIcon';
// import ActionButtons from "../Buttons/ActionButtons";
import ActionButtons from "./FooterButtons";
import CardBadges from "./CardBadges";
import cardStyles from '../../styles';

// ---------- Types ----------

interface WorkshopRequest {
  id: number;
  title: string;
  coach: string;
  hub: string;
  requestedDate: string;
  overdueDays: number;
  status: string;
  participants: number;
  location: string;
}

interface CardProps {
  item: WorkshopRequest;
  onViewFullDetails?: () => void;
  onRequestInfo?: () => void;
  onDecline?: () => void;
  onAcceptAndSchedule?: () => void;
}

// ---------- Card ----------

function Card({
  item,
  onViewFullDetails,
  onRequestInfo,
  onDecline,
  onAcceptAndSchedule,
}: CardProps) {
  return (
    <Box
      {...cardStyles.cardContainer}
    >
      {/* Top Header Row */}
      <HStack {...cardStyles.cardHeaderRow}>
        {/* Left Side: Title & Sub-metadata */}
        <VStack {...cardStyles.cardTitleCol}>
          <HStack {...cardStyles.cardTitleRow}>
            <LucideIcon name="Box" {...cardStyles.iconAssetsTitle} />
            <Text {...cardStyles.cardTitleText}>
              {item.title}
            </Text>
          </HStack>

          {/* Sub Metadata Row */}
          <HStack {...cardStyles.cardSubMetaRow}>
            <HStack {...cardStyles.cardSubMetaItem}>
              <LucideIcon name="Users" {...cardStyles.iconSubMeta} />
              <Text {...cardStyles.cardSubMetaText}>
                {item.coach}
              </Text>
            </HStack>

            <HStack {...cardStyles.cardSubMetaItem}>
              <LucideIcon name="Building2" {...cardStyles.iconSubMeta} />
              <Text {...cardStyles.cardSubMetaText}>
                {item.hub}
              </Text>
            </HStack>

            <HStack {...cardStyles.cardSubMetaItem}>
              <LucideIcon name="Calendar" {...cardStyles.iconSubMeta} />
              <Text {...cardStyles.cardSubMetaText}>
                Requested {item.requestedDate}
              </Text>
            </HStack>
          </HStack>
        </VStack>

        {/* Right Side: Badges */}
        <CardBadges overdueDays={item.overdueDays} status={item.status} />
      </HStack>

      {/* Middle Light-Gray Detail Box */}
      <Box {...cardStyles.detailBox}>
        <HStack {...cardStyles.cardDetailRow}>
          {/* Left Column */}
          <VStack {...cardStyles.cardDetailCol}>
            <HStack {...cardStyles.cardSubMetaItem}>
              <LucideIcon name="Users" {...cardStyles.iconDetailBold} />
              <Text {...cardStyles.cardDetailBoldText}>
                {item.participants} participants
              </Text>
            </HStack>
          </VStack>

          {/* Right Column */}
          <VStack {...cardStyles.cardDetailCol}>
            <HStack {...cardStyles.cardSubMetaItem}>
              <LucideIcon name="MapPin" {...cardStyles.iconDetailText} />
              <Text {...cardStyles.cardDetailText}>
                {item.location}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Bottom Footer Actions */}
      <ActionButtons
        onViewFullDetails={onViewFullDetails}
        onRequestInfo={onRequestInfo}
        onDecline={onDecline}
        onAcceptAndSchedule={onAcceptAndSchedule}
      />
    </Box>
  );
}

interface ListCardProps {
  items?: any[];
  onViewFullDetails?: (item: any) => void;
  onRequestInfo?: (item: any) => void;
  onDecline?: (item: any) => void;
  onAcceptAndSchedule?: (item: any) => void;
}

export default function AssestsCard({
  items = [],
  onViewFullDetails,
  onRequestInfo,
  onDecline,
  onAcceptAndSchedule,
}: ListCardProps): React.ReactElement {
  const displayItems = items;

  return (
    <VStack {...cardStyles.cardListContainer}>
      {displayItems.map((item) => (
        <Card
          key={item.id}
          item={item}
          onViewFullDetails={() => onViewFullDetails?.(item)}
          onRequestInfo={() => onRequestInfo?.(item)}
          onDecline={() => onDecline?.(item)}
          onAcceptAndSchedule={() => onAcceptAndSchedule?.(item)}
        />
      ))}
    </VStack>
  );
}