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
      <HStack justifyContent="space-between" alignItems="flex-start" mb="$4">
        {/* Left Side: Title & Sub-metadata */}
        <VStack space="xs" flex={1} mr="$3">
          <HStack space="sm" alignItems="center">
            <LucideIcon name="Box" size={19} color="$success600" />
            <Text fontSize="$md" fontWeight="$bold" color="$textDark900">
              {item.title}
            </Text>
          </HStack>

          {/* Sub Metadata Row */}
          <HStack space="lg" alignItems="center" flexWrap="wrap" mt="$0.5">
            <HStack space="xs" alignItems="center">
              <LucideIcon name="Users" size={14} color="$textDark500" />
              <Text fontSize="$xs" color="$textDark600">
                {item.coach}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="Building2" size={14} color="$textDark500" />
              <Text fontSize="$xs" color="$textDark600">
                {item.hub}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="Calendar" size={14} color="$textDark500" />
              <Text fontSize="$xs" color="$textDark600">
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
        <HStack alignItems="center">
          {/* Left Column */}
          <VStack space="sm" flex={1}>
            <HStack space="xs" alignItems="center">
              <LucideIcon name="Users" size={15} color="$textDark600" />
              <Text fontSize="$sm" fontWeight="$bold" color="$textDark800">
                {item.participants} participants
              </Text>
            </HStack>
          </VStack>

          {/* Right Column */}
          <VStack space="sm" flex={1}>
            <HStack space="xs" alignItems="center">
              <LucideIcon name="MapPin" size={15} color="$textDark500" />
              <Text fontSize="$sm" color="$textDark700">
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
    <VStack space="md" width="100%">
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