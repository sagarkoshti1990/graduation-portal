import React, { useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  LucideIcon,
  Badge,
  BadgeText,
  Divider,
  useAlert,
} from '@ui';
import { openFilePicker } from '../../../../../project-player/components/Task/FileEvidence/file-picker';

// ---------- Types ----------

interface MaterialItem {
  name: string;
  info: string;
}

interface TrainingSessionItem {
  id: number;
  title: string;
  status: 'Upcoming' | 'In progress' | 'Completed';
  date: string;
  time: string;
  format: string;
  participants: string;
  requestedBy: string;
  province: string;
  siteKey: string;
  hasCopyButton: boolean;
  
  // Expanded fields
  location: string;
  expectedParticipants: number;
  confirmedPresent: string;
  notes: string;
  materials: MaterialItem[];
}

// ---------- JSON array data ----------

const mockTrainings: TrainingSessionItem[] = [
  {
    id: 1,
    title: 'Financial Literacy Workshop',
    status: 'Upcoming',
    date: '25 Apr 2026',
    time: '09:00 - 12:00',
    format: 'In-person',
    participants: '25 participants',
    requestedBy: 'Sipho Mkhize (Johannesburg Youth Development) • Gauteng',
    province: 'Gauteng',
    siteKey: 'joburg-center',
    hasCopyButton: true,
    location: 'Community Centre, Soweto, Johannesburg',
    expectedParticipants: 25,
    confirmedPresent: 'Not confirmed',
    notes: 'Participants are youth aged 18-24, mixed literacy levels. Requested focus on budgeting and savings.',
    materials: [
      {
        name: 'Financial Literacy Workbook.pdf',
        info: 'PDF • 2.4 MB • Uploaded 2026/04/15',
      },
    ],
  },
  {
    id: 2,
    title: 'Business Plan Development Training',
    status: 'In progress',
    date: '18 Apr 2026',
    time: '14:00 - 17:00',
    format: 'Hybrid',
    participants: '--',
    requestedBy: 'Thandiwe Ndlovu (Cape Town Enterprise Support) • Western Cape',
    province: 'Western Cape',
    siteKey: 'ct-office',
    hasCopyButton: false,
    location: 'Cape Town Civic Centre, Cape Town',
    expectedParticipants: 30,
    confirmedPresent: '12 present',
    notes: 'Focus on business plan templates, cost projection sheets, and compliance rules.',
    materials: [],
  },
  {
    id: 3,
    title: 'Digital Marketing Basics',
    status: 'Completed',
    date: '10 Apr 2026',
    time: '09:00 - 13:00',
    format: 'Virtual',
    participants: '6 participants',
    requestedBy: 'Mpho Khumalo (KZN Skills Initiative) • KwaZulu-Natal',
    province: 'KwaZulu-Natal',
    siteKey: 'kzn-hub',
    hasCopyButton: true,
    location: 'Online via Microsoft Teams',
    expectedParticipants: 10,
    confirmedPresent: '6 present',
    notes: 'Overview of social media platforms, SEO basics, and simple content creation calendars.',
    materials: [
      {
        name: 'Digital Marketing Guide.pdf',
        info: 'PDF • 1.8 MB • Uploaded 2026/04/10',
      },
    ],
  },
];

// ---------- Card ----------

interface CardProps {
  item: TrainingSessionItem;
}

const Card: React.FC<CardProps> = ({ item }) => {
  const { showAlert } = useAlert();
  const [isExpanded, setIsExpanded] = useState(false);
  const [files, setFiles] = useState<MaterialItem[]>(item.materials);

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

  const handleCopySession = () => {
    showAlert('success', 'Session copied successfully!');
  };

  const handleUploadPress = async () => {
    try {
      const selectedFiles = await openFilePicker({
        allowMultiSelection: true,
        type: ['application/pdf', 'image/*'],
      });
      
      if (!selectedFiles || selectedFiles.length === 0) return;
      
      const newMaterials: MaterialItem[] = selectedFiles.map(file => {
        const name = file.name || file.fileName || 'Untitled File';
        const sizeBytes = file.size || file.fileSize || 0;
        const sizeStr = sizeBytes > 0 
          ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` 
          : 'Unknown size';
        const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '/');

        return {
          name,
          info: `${ext} • ${sizeStr} • Uploaded ${dateStr}`,
        };
      });

      setFiles(prev => [...prev, ...newMaterials]);
      showAlert('success', 'Material uploaded successfully!');
    } catch (err) {
      // User cancelled picker or error occurred, do nothing
    }
  };

  return (
    <Box
      width="100%"
      bg="$white"
      borderRadius="$2xl"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      shadowColor="$black"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.04}
      shadowRadius={8}
      elevation={2}
    >
      {/* Accordion Header (Trigger) - Always White background, no hover bg changes */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        px="$5"
        py="$5"
        width="100%"
        sx={{
          ':hover': {
            backgroundColor: '$white',
          },
        }}
      >
        <VStack space="md" width="100%">
          {/* Row 1: Title + Badge & Chevron */}
          <HStack justifyContent="space-between" alignItems="center" width="100%">
            <HStack space="sm" alignItems="center" flex={1}>
              <Text fontSize="$md" fontWeight="$semibold" color="$textForegroundColor">
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
            <LucideIcon
              name={isExpanded ? "ChevronUp" : "ChevronDown"}
              size={18}
              color="$textMuted"
            />
          </HStack>

          {/* Row 2: Metadata */}
          <HStack space="xl" alignItems="center" flexWrap="wrap" width="100%">
            <HStack space="xs" alignItems="center">
              <LucideIcon name="Calendar" size={14} color="$textSecondary" />
              <Text fontSize="$sm" color="$textSecondary">
                {item.date}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="Clock" size={14} color="$textSecondary" />
              <Text fontSize="$sm" color="$textSecondary">
                {item.time}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="MapPin" size={14} color="$textSecondary" />
              <Text fontSize="$sm" color="$textSecondary">
                {item.format}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center">
              <LucideIcon name="Users" size={14} color="$textSecondary" />
              <Text fontSize="$sm" color="$textSecondary">
                {item.participants}
              </Text>
            </HStack>
          </HStack>

          {/* Row 3: Requested by & Copy Button */}
          <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" space="sm" width="100%">
            <Text fontSize="$sm" color="$textSecondary" flex={1} minWidth={200}>
              Requested by: {item.requestedBy}
            </Text>

            {item.hasCopyButton && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleCopySession();
                }}
              >
                {({ hovered }: any) => {
                  const isHovered = hovered || false;
                  return (
                    <Box
                      borderWidth={1}
                      borderColor={isHovered ? "$primary500" : "$primary600"}
                      bg={isHovered ? "$primary500" : "transparent"}
                      px="$4"
                      py="$2"
                      borderRadius="$lg"
                    >
                      <HStack space="xs" alignItems="center">
                        <LucideIcon 
                          name="Copy" 
                          size={14} 
                          color={isHovered ? "$white" : "$primary500"} 
                        />
                        <Text 
                          fontSize="$sm" 
                          fontWeight="$normal" 
                          color={isHovered ? "$white" : "$primary500"}
                        >
                          Copy Session
                        </Text>
                      </HStack>
                    </Box>
                  );
                }}
              </Pressable>
            )}
          </HStack>
        </VStack>
      </Pressable>

      {/* Accordion Content with light grey background */}
      {isExpanded && (
        <VStack width="100%" bg="$hoverBackground">
          <Divider bg="$borderColor" />
          
          <VStack px="$5" pb="$5" pt="$4" space="lg" width="100%">
            {/* Section 1: Location */}
            <VStack space="xs" width="100%">
              <Text fontSize="$sm" fontWeight="$bold" color="$textForegroundColor">
                Location
              </Text>
              <HStack space="xs" alignItems="center" flexWrap="wrap" width="100%">
                <LucideIcon name="MapPin" size={14} color="$textSecondary" />
                <Text fontSize="$sm" color="$textPrimary" flex={1}>
                  {item.location}
                </Text>
              </HStack>
            </VStack>

            {/* Section 2: Attendance - Styled as White Card with Border */}
            <VStack space="xs" width="100%">
              <Text fontSize="$sm" fontWeight="$bold" color="$textForegroundColor">
                Attendance
              </Text>
              <Box bg="$white" borderWidth={1} borderColor="$borderColor" p="$4" borderRadius="$lg" width="100%">
                <HStack space="xl" flexWrap="wrap" width="100%">
                  <VStack space="xs" flex={1} minWidth={120}>
                    <Text fontSize="$xs" color="$textSecondary">
                      Expected Participants
                    </Text>
                    <Text fontSize="$md" fontWeight="$bold" color="$textPrimary">
                      {item.expectedParticipants}
                    </Text>
                  </VStack>
                  <VStack space="xs" flex={1} minWidth={120}>
                    <Text fontSize="$xs" color="$textSecondary">
                      Confirmed Present
                    </Text>
                    <Text fontSize="$sm" color="$textSecondary">
                      {item.confirmedPresent}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>

            {/* Section 3: Session Materials */}
            <VStack space="sm" width="100%">
              <HStack justifyContent="space-between" alignItems="center" width="100%">
                <Text fontSize="$sm" fontWeight="$bold" color="$textForegroundColor">
                  Session Materials
                </Text>
                <Pressable
                  borderWidth={1}
                  borderColor="$borderColor"
                  bg="$white"
                  px="$3"
                  py="$1.5"
                  borderRadius="$lg"
                  onPress={handleUploadPress}
                  sx={{
                    ':hover': { backgroundColor: '$hoverBackground' }
                  }}
                >
                  <HStack space="xs" alignItems="center">
                    <LucideIcon name="Upload" size={14} color="$textSecondary" />
                    <Text fontSize="$xs" fontWeight="$bold" color="$textSecondary">
                      Upload Material
                    </Text>
                  </HStack>
                </Pressable>
              </HStack>

              {/* Files list - File cards styled in White with Border */}
              <VStack space="xs" width="100%">
                {files.map((file, idx) => (
                  <Box
                    key={idx}
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$lg"
                    p="$3"
                    bg="$white"
                    width="100%"
                  >
                    <HStack justifyContent="space-between" alignItems="center" space="sm" width="100%">
                      <HStack space="sm" alignItems="center" flex={1}>
                        <Box bg="$primary100" p="$2" borderRadius="$md">
                          <LucideIcon name="FileText" size={16} color="$primary500" />
                        </Box>
                        <VStack flex={1}>
                          <Text fontSize="$sm" fontWeight="$bold" color="$textPrimary" numberOfLines={1} ellipsizeMode="tail">
                            {file.name}
                          </Text>
                          <Text fontSize="$xs" color="$textSecondary">
                            {file.info}
                          </Text>
                        </VStack>
                      </HStack>
                      <Pressable
                        onPress={() => showAlert('info', `Downloading ${file.name}...`)}
                        p="$1"
                      >
                        <LucideIcon name="Download" size={16} color="$textSecondary" />
                      </Pressable>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </VStack>

            {/* Section 4: Session Notes - Styled as White Card with Border */}
            <VStack space="xs" width="100%">
              <Text fontSize="$sm" fontWeight="$bold" color="$textForegroundColor">
                Session Notes
              </Text>
              <Box bg="$white" borderWidth={1} borderColor="$borderColor" p="$4" borderRadius="$lg" width="100%">
                <Text fontSize="$sm" color="$textSecondary" lineHeight="$md">
                  {item.notes}
                </Text>
              </Box>
            </VStack>
          </VStack>
        </VStack>
      )}
    </Box>
  );
};

// ---------- ListCard ----------

export default function TrainingCard(): React.ReactElement {
  return (
    <VStack space="md" width="100%">
      {mockTrainings.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </VStack>
  );
}
