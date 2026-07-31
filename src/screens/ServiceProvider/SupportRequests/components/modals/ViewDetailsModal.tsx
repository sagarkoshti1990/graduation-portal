import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import Modal from '@components/ui/Modal';
import LucideIcon from '@components/ui/LucideIcon';
import { SUPPORT_REQUEST_BUTTON_TEXTS } from '../../constants/supportRequests.constants';

export interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onRequestInfo?: () => void;
  onDecline?: () => void;
  onAcceptRequest?: () => void;
}

export default function ViewDetailsModal({
  isOpen,
  onClose,
  item,
  onRequestInfo,
  onDecline,
  onAcceptRequest,
}: ViewDetailsModalProps): React.JSX.Element {
  if (!isOpen || !item) return <></>;

  const hasPreferredInfo =
    item.type === 'Training' ||
    !!item.preferredDate ||
    !!item.preferredTime ||
    !!item.preferredLocation;

  const title = item.title;
  const status = item.status || 'Pending';
  const categoryTag = item.type || (hasPreferredInfo ? 'Training' : 'Service/Asset');

  const coachName = item.coach;
  const hubName = item.hub;
  const email = item.email;
  const phone = item.phone;

  const participantsCount = `${item.participants} participants`;
  const province = item.province || item.location;
  const category = item.category;

  const justification = item.justification;
  const participantDetails = item.participantDetails;
  const specialRequirements = item.specialRequirements;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      maxWidth={780}
      headerContent={
        <VStack space="xs" flex={1}>
          <Text fontSize="$xl" fontWeight="$bold" color="$textDark900">
            {title}
          </Text>
          <HStack space="xs" alignItems="center">
            {/* Status Badge */}
            <Box
              bg="$yellow100"
              borderColor="$yellow200"
              borderWidth={1}
              px="$3"
              py="$0.5"
              borderRadius="$full"
            >
              <Text fontSize="$xs" color="$yellow500" fontWeight="$bold">
                {status}
              </Text>
            </Box>

            {/* Category/Type Tag Badge */}
            <Box bg="$gray100" px="$3" py="$0.5" borderRadius="$full">
              <Text fontSize="$xs" color="$gray700" fontWeight="$medium">
                {categoryTag}
              </Text>
            </Box>
          </HStack>
        </VStack>
      }
      footerContent={
        <HStack space="sm" width="$full" justifyContent="flex-end" alignItems="center">
          {/* Request Info Button */}
          <Pressable
            onPress={() => {
              onClose();
              onRequestInfo?.();
            }}
            borderWidth={1}
            borderColor="$gray200"
            bg="$white"
            px="$4"
            py="$2"
            borderRadius="$lg"
            sx={{ ':active': { bg: '$gray50' } }}
          >
            <HStack space="md" alignItems="center">
              <LucideIcon name="MessageSquare" size={14} color="$textDark900" />
              <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                {SUPPORT_REQUEST_BUTTON_TEXTS.REQUEST_INFO}
              </Text>
            </HStack>
          </Pressable>

          {/* Decline Button */}
          <Pressable
            onPress={() => {
              onClose();
              onDecline?.();
            }}
            borderWidth={1}
            borderColor="$red100"
            bg="$white"
            px="$4"
            py="$2"
            borderRadius="$lg"
            sx={{ ':active': { bg: '$red50' } }}
          >
            <HStack space="md" alignItems="center">
              <LucideIcon name="X" size={14} color="$red600" />
              <Text fontSize="$sm" fontWeight="$bold" color="$red600">
                {SUPPORT_REQUEST_BUTTON_TEXTS.DECLINE}
              </Text>
            </HStack>
          </Pressable>

          {/* Accept Request Button */}
          <Pressable
            onPress={() => {
              onClose();
              onAcceptRequest?.();
            }}
            bg="$success600"
            px="$4.5"
            py="$2"
            borderRadius="$lg"
            shadowColor="$pillarLivelihoods"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.25}
            shadowRadius={6}
            elevation={2}
            sx={{ ':active': { bg: '$pillarLivelihoods' } }}
          >
            <HStack space="md" alignItems="center">
              <LucideIcon name="CheckCircle" size={16} color="$white" />
              <Text fontSize="$sm" fontWeight="$bold" color="$white">
                {SUPPORT_REQUEST_BUTTON_TEXTS.ACCEPT_REQUEST}
              </Text>
            </HStack>
          </Pressable>
        </HStack>
      }
    >
      <VStack space="lg" width="100%" py="$2">
        {/* Coach Information */}
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900" mb="$1">
            Coach Information
          </Text>
          <Box bg="$bgSidebar" p="$4" borderRadius="$xl">
            <VStack space="sm">
              <HStack space="sm" alignItems="center">
                <LucideIcon name="User" size={16} color="$textDark500" />
                <Text fontSize="$sm" fontWeight="$bold" color="$textDark800">
                  {coachName}
                </Text>
              </HStack>

              <HStack space="sm" alignItems="center">
                <LucideIcon name="Building2" size={16} color="$textDark500" />
                <Text fontSize="$sm" color="$textDark600">
                  {hubName}
                </Text>
              </HStack>

              {email && (
                <HStack space="sm" alignItems="center">
                  <LucideIcon name="Mail" size={16} color="$blue600" />
                  <Text fontSize="$sm" color="$blue600">
                    {email}
                  </Text>
                </HStack>
              )}

              {phone && (
                <HStack space="sm" alignItems="center">
                  <LucideIcon name="Phone" size={16} color="$blue600" />
                  <Text fontSize="$sm" color="$blue600">
                    {phone}
                  </Text>
                </HStack>
              )}
            </VStack>
          </Box>
        </VStack>

        {/* Request Details */}
        <VStack space="xs">
          <Text fontSize="$sm" fontWeight="$bold" color="$textDark900" mb="$1">
            Request Details
          </Text>
          <VStack space="sm">
            {hasPreferredInfo ? (
              /* Training & Sessions or Extended Details Grid */
              <>
                <HStack space="sm" width="100%">
                  <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" flex={1}>
                    <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                      Participants
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                      {participantsCount}
                    </Text>
                  </Box>

                  <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" flex={1}>
                    <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                      Preferred Date
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                      {item.preferredDate || 'N/A'}
                    </Text>
                  </Box>
                </HStack>

                <HStack space="sm" width="100%">
                  <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" flex={1}>
                    <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                      Preferred Time
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                      {item.preferredTime || 'N/A'}
                    </Text>
                  </Box>

                  <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" flex={1}>
                    <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                      Preferred Location
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                      {item.preferredLocation || 'N/A'}
                    </Text>
                  </Box>
                </HStack>

                <HStack space="sm" width="100%">
                  <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" flex={1}>
                    <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                      Province
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                      {province}
                    </Text>
                  </Box>

                  <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" flex={1}>
                    <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                      Category
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                      {category}
                    </Text>
                  </Box>
                </HStack>
              </>
            ) : (
              /* Standard Service / Asset Grid (3 fields) */
              <>
                <HStack space="sm" width="100%">
                  <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" flex={1}>
                    <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                      Participants
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                      {participantsCount}
                    </Text>
                  </Box>

                  <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" flex={1}>
                    <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                      Province
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                      {province}
                    </Text>
                  </Box>
                </HStack>

                <Box bg="$bgSidebar" p="$3.5" borderRadius="$lg" width="100%">
                  <Text fontSize="$xs" color="$textDark500" mb="$0.5">
                    Category
                  </Text>
                  <Text fontSize="$sm" fontWeight="$bold" color="$textDark900">
                    {category}
                  </Text>
                </Box>
              </>
            )}
          </VStack>
        </VStack>

        {/* Request Justification */}
        {justification && (
          <VStack space="xs">
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark900" mb="$1">
              Request Justification
            </Text>
            <Box bg="$bgSidebar" p="$4" borderRadius="$lg">
              <Text fontSize="$sm" color="$textDark700" lineHeight="$md">
                {justification}
              </Text>
            </Box>
          </VStack>
        )}

        {/* Participant Details */}
        {participantDetails && (
          <VStack space="xs">
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark900" mb="$1">
              Participant Details
            </Text>
            <Box bg="$bgSidebar" p="$4" borderRadius="$lg">
              <Text fontSize="$sm" color="$textDark700" lineHeight="$md">
                {participantDetails}
              </Text>
            </Box>
          </VStack>
        )}

        {/* Special Requirements */}
        {specialRequirements && (
          <VStack space="xs">
            <Text fontSize="$sm" fontWeight="$bold" color="$textDark900" mb="$1">
              Special Requirements
            </Text>
            <Box
              bg="$optionalTaskYellowBg"
              borderWidth={1}
              borderColor="$optionalTaskYellowBorder"
              p="$3.5"
              borderRadius="$lg"
            >
              <HStack space="sm" alignItems="center">
                <LucideIcon name="AlertCircle" size={18} color="$warning500" />
                <Text fontSize="$sm" fontWeight="$medium" color="$warning500">
                  {specialRequirements}
                </Text>
              </HStack>
            </Box>
          </VStack>
        )}
      </VStack>
    </Modal>
  );
}
