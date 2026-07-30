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

interface AssetItem {
  id: number;
  title: string;
  status: 'Upcoming' | 'Accepted' | 'Pending' | 'Rejected';
  type: string;
  description: string;
  sector: string;
  value: string;
  location: string;
  requests: string;
  province: string;
  siteKey: string;
}

// ---------- JSON array data ----------

const mockAssets: AssetItem[] = [
  {
    id: 1,
    title: 'Sewing Machine Provision',
    status: 'Upcoming',
    type: 'In-kind',
    description: '',
    sector: 'Manufacturing',
    value: 'R 3 500',
    location: 'Limpopo',
    requests: '0 requests received',
    province: 'Limpopo',
    siteKey: 'joburg-center',
  },
  {
    id: 2,
    title: 'Industrial Sewing Machine Allocation',
    status: 'Accepted',
    type: 'In-kind',
    description: 'Industrial sewing machines for textile entrepreneurs in the Limpopo region.',
    sector: 'Manufacturing',
    value: 'R 35 000',
    location: 'Limpopo',
    requests: '6 requests received',
    province: 'Limpopo',
    siteKey: 'ct-office',
  },
  {
    id: 3,
    title: 'Agricultural Seedlings & Toolkit Package',
    status: 'Pending',
    type: 'In-kind',
    description: 'High-yield vegetable seedlings and manual farming tools for smallholder farmers.',
    sector: 'Agriculture',
    value: 'R 22 000',
    location: 'Limpopo',
    requests: '12 requests received',
    province: 'Limpopo',
    siteKey: 'kzn-hub',
  },
  {
    id: 4,
    title: 'Laptop Lending Kit for Digital Entrepreneurs',
    status: 'Rejected',
    type: 'In-kind',
    description: 'Refurbished laptops on 3-month loan for youth completing software & web design courses.',
    sector: 'Technology and ICT',
    value: 'R 48 000',
    location: 'Western Cape',
    requests: '10 requests received',
    province: 'Western Cape',
    siteKey: 'ct-office',
  },
];

// ---------- Card ----------

interface CardProps {
  item: AssetItem;
}

const Card: React.FC<CardProps> = ({ item }) => {
  const { showAlert } = useAlert();

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return { bg: '$blue50', border: '$blue200', text: '$blue600', icon: 'Clock' };
      case 'Accepted':
        return { bg: '$success50', border: '$success300', text: '$success600', icon: 'CheckCircle' };
      case 'Pending':
        return { bg: '$observationTaskBg', border: '$warningIconColor', text: '$warningIconColor', icon: 'Clock' };
      case 'Rejected':
      default:
        return { bg: '$error50', border: '$error200', text: '$error600', icon: 'AlertCircle' };
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
          {/* Row 1: Title + Badges */}
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

            {item.type ? (
              <Badge
                bg="$success50"
                borderColor="$success300"
                borderWidth={1}
                px="$2.5"
                py="$0.5"
                borderRadius="$full"
              >
                <BadgeText fontSize="$xs" color="$success600" fontWeight="$semibold">
                  {item.type}
                </BadgeText>
              </Badge>
            ) : null}
          </HStack>

          {item.description ? (
            <Text fontSize="$sm" color="$textSecondary" lineHeight="$md">
              {item.description}
            </Text>
          ) : null}

          {/* Row 2: Metadata */}
          <HStack space="md" alignItems="center" flexWrap="wrap">
            <HStack space="xs" alignItems="center">
              <LucideIcon name="Briefcase" size={14} color="$textSecondary" />
              <Text fontSize="$xs" color="$textSecondary">
                {item.sector}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="MapPin" size={14} color="$textSecondary" />
              <Text fontSize="$xs" color="$textSecondary">
                {item.location}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <Text fontSize="$xs" fontWeight="bold" color="$textPrimary">
                Value: {item.value}
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
        </VStack>
      </HStack>
    </Box>
  );
};

// ---------- ListCard ----------

export default function AssetCard(): React.ReactElement {
  return (
    <VStack space="md" width="100%">
      {mockAssets.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </VStack>
  );
}
