import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  LucideIcon,
  Badge,
  BadgeText,
  useAlert,
} from '@ui';

// ---------- Types ----------

interface ServiceItem {
  id: number;
  title: string;
  status: 'Upcoming' | 'In progress' | 'Completed';
  description: string;
  location: string;
  hubOffice: string;
  site: string;
  requests: string;
  actionType: 'copy' | 'complete';
  province: string;
  siteKey: string;
}

// ---------- JSON array data ----------

const mockServices: ServiceItem[] = [
  {
    id: 1,
    title: 'Legal Advisory — Labour Law',
    status: 'Upcoming',
    description: 'On-site legal advisory sessions covering labour law, employee rights, and basic contract literacy.',
    location: 'Gauteng',
    hubOffice: 'Tshwane',
    site: 'Tshwane Community Hub',
    requests: '4 requests received',
    actionType: 'copy',
    province: 'Gauteng',
    siteKey: 'tshwane-hub',
  },
  {
    id: 2,
    title: 'CIPC Business Formalisation & Registration',
    status: 'In progress',
    description: 'Direct assistance registering informal businesses with CIPC and tax authorities.',
    location: 'Western Cape',
    hubOffice: 'Cape Town',
    site: 'Cape Town Enterprise Office',
    requests: '6 requests received',
    actionType: 'complete',
    province: 'Western Cape',
    siteKey: 'ct-office',
  },
  {
    id: 3,
    title: 'Emergency Municipal Indigent Support Package',
    status: 'Completed',
    description: 'Help vulnerable households apply for municipal utility rebates and indigent grants.',
    location: 'Gauteng',
    hubOffice: 'Johannesburg',
    site: 'Johannesburg Civic Center',
    requests: '9 requests received',
    actionType: 'copy',
    province: 'Gauteng',
    siteKey: 'joburg-center',
  },
];

// ---------- Card ----------

interface CardProps {
  item: ServiceItem;
}

const Card: React.FC<CardProps> = ({ item }) => {
  const { showAlert } = useAlert();

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return { bg: '$blue50', border: '$blue200', text: '$blue600', icon: 'Clock' };
      case 'In progress':
        return { bg: '$observationTaskBg', border: '$warningIconColor', text: '$warningIconColor', icon: 'Clock' };
      case 'Completed':
      default:
        return { bg: '$success50', border: '$success300', text: '$success600', icon: 'CheckCircle' };
    }
  };

  const statusColors = getStatusColors(item.status);

  return (
    <Box
      bg="$white"
      borderRadius="$2xl"
      borderWidth={1}
      borderColor="$borderColor"
      p="$5"
      shadowColor="$black"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.04}
      shadowRadius={8}
      elevation={2}
      width="100%"
    >
      <HStack
        flexDirection="column"
        $md-flexDirection="row"
        justifyContent="space-between"
        alignItems="stretch"
        $md-alignItems="center"
        space="lg"
      >
        {/* Left Side: Info */}
        <VStack flex={1} space="sm">
          {/* Row 1: Title + Badge */}
          <HStack space="sm" alignItems="center" flexWrap="wrap">
            <Text fontSize="$md" fontWeight="$bold" color="$textForegroundColor">
              {item.title}
            </Text>
            <Badge
              bg={statusColors.bg}
              borderColor={statusColors.border}
              borderWidth={1}
              px="$2.5"
              py="$0.5"
              borderRadius="$full"
            >
              <HStack space="xs" alignItems="center">
                <LucideIcon name={statusColors.icon} size={12} color={statusColors.text} />
                <BadgeText fontSize="$xs" color={statusColors.text} fontWeight="$semibold">
                  {item.status}
                </BadgeText>
              </HStack>
            </Badge>
          </HStack>

          {item.description ? (
            <Text fontSize="$sm" color="$textSecondary" lineHeight="$md">
              {item.description}
            </Text>
          ) : null}

          {/* Row 2: Metadata */}
          <HStack space="md" alignItems="center" flexWrap="wrap">
            <HStack space="xs" alignItems="center">
              <LucideIcon name="MapPin" size={14} color="$textSecondary" />
              <Text fontSize="$xs" color="$textSecondary">
                {item.location}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="Navigation" size={14} color="$textSecondary" />
              <Text fontSize="$xs" color="$textSecondary">
                Hub: {item.hubOffice}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="Building" size={14} color="$textSecondary" />
              <Text fontSize="$xs" color="$textSecondary">
                {item.site}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="Users" size={14} color="$textSecondary" />
              <Text fontSize="$xs" color="$textSecondary">
                {item.requests}
              </Text>
            </HStack>
          </HStack>
        </VStack>

        {/* Right Side: Action Buttons stacked vertically */}
        <VStack
          space="xs"
          width="100%"
          $md-width={160}
          justifyContent="center"
          alignSelf="stretch"
        >
          <Pressable
            borderWidth={1}
            borderColor="$borderColor"
            bg="$white"
            px="$4"
            py="$2"
            borderRadius="$lg"
            alignItems="center"
            onPress={() => showAlert('info', 'Viewing requests...')}
            sx={{
              ':hover': { bg: '$hoverBackground' },
              ':active': { bg: '$hoverBackground' }
            }}
          >
            <Text fontSize="$sm" fontWeight="$normal" color="$textSecondary">
              View Requests
            </Text>
          </Pressable>

          {item.actionType === 'copy' ? (
            <Pressable
              borderWidth={1}
              borderColor="$primary600"
              bg="$primary100"
              px="$4"
              py="$2"
              borderRadius="$lg"
              alignItems="center"
              onPress={() => showAlert('success', 'Offering copied successfully!')}
              sx={{
                ':hover': { bg: '$primary300' },
                ':active': { bg: '$primary300' }
              }}
            >
              <HStack space="xs" alignItems="center" justifyContent="center">
                <LucideIcon name="Copy" size={14} color="$primary500" />
                <Text fontSize="$sm" fontWeight="$normal" color="$primary500">
                  Copy Offering
                </Text>
              </HStack>
            </Pressable>
          ) : (
            <Pressable
              bg="$success600"
              px="$4"
              py="$2"
              borderRadius="$lg"
              alignItems="center"
              onPress={() => showAlert('success', 'Offering marked as complete!')}
              sx={{
                ':hover': { bg: '$success700' },
                ':active': { bg: '$success700' }
              }}
            >
              <HStack space="xs" alignItems="center" justifyContent="center">
                <LucideIcon name="CheckCircle" size={14} color="$white" />
                <Text fontSize="$sm" fontWeight="$normal" color="$white">
                  Complete
                </Text>
              </HStack>
            </Pressable>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

// ---------- ListCard ----------

export default function AdditionalServicesCard(): React.ReactElement {
  return (
    <VStack space="md" width="100%">
      {mockServices.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </VStack>
  );
}
