import React, { useState, useMemo } from 'react';
import {
 Text,
 Card,
 Heading,
 View,
 Checkbox,
 CheckboxIndicator,
 CheckboxIcon,
 CheckIcon,
 CheckboxLabel,
 VStack,
 HStack,
 Divider,
 Button,
 Pressable,
 Box,
 Modal,
 useAlert,
  Badge,
  BadgeText,
} from '@ui';
import FilterButton from '@components/Filter';
import { AssignUsersStyles } from './Styles';
import type { TextProps, ViewProps } from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import { titleHeaderStyles } from '@components/TitleHeader/Styles';
import { LucideIcon } from '@ui';
import { theme } from '@config/theme';
import { getInitials } from '@utils/helper';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import DataTable from '@components/DataTable';
import type { ColumnDef } from '@app-types/components';


interface UserAvatarCardProps {
 title: string;
 description: string;
 filterOptions?: any;
 onChange?: (values: Record<string, any>) => void;
 selectedValues?: Record<string, any>;
 showSelectedCard?: boolean;
 showLcList?: boolean;
 showLcListforSupervisorTeam?: boolean;
 onLcSelect?: (lc: any) => void;
 onAssign?: (selectedLCs: any[]) => void;
 lcList?: any[]; // Optional filtered LC list (if not provided, uses default selectedLCList)
 isParticipantList?: boolean; // Flag to indicate if this is a participant list (different button text)
 isLoading?: boolean; // Loading state for the data table
}


const UserAvatarCard = ({
  title,
  description,
  filterOptions,
  onChange,
  selectedValues = {},
  showSelectedCard = false,
  showLcList = true,
  showLcListforSupervisorTeam = false,
  onLcSelect,
  onAssign,
  lcList,
  isParticipantList = false,
  isLoading = false,
}: UserAvatarCardProps) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [selectedLc, setSelectedLc] = useState<any>(null);
  const [selectedLCs, setSelectedLCs] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    selectedLCs?: any[];
    selectedParticipants?: any[];
    supervisorData?: any;
    lcData?: any;
  } | null>(null);
  // Pagination state for participants table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  
  // Use provided lcList or fall back to empty array
  const displayLCList = lcList || [];

  const participantColumns: ColumnDef<any>[] = useMemo(() => [
    {
      key: 'name',
      label: 'admin.assignUsers.participant',
      align: 'left',
      flex: 1,
      render: (item: any) => (
        <HStack
          {...(AssignUsersStyles.viewstyles as ViewProps)}
          flex={1}
          width="100%"
          alignItems="center"
          space="sm"
        >
          {/* Checkbox + Avatar managed inside name (no separate columns) */}
          <Checkbox
            value={item.value}
            isChecked={selectedLCs.has(item.value)}
            onChange={(checked: boolean) => {
              setSelectedLCs((prev) => {
                const newSet = new Set(prev);
                if (checked) newSet.add(item.value);
                else newSet.delete(item.value);
                return newSet;
              });
            }}
          >
            <CheckboxIndicator borderWidth={1} borderColor="$textForeground">
              <CheckboxIcon as={CheckIcon} color="$modalBackground" />
            </CheckboxIndicator>
          </Checkbox>

          <Box {...(AssignUsersStyles.initialsBoxSmStyles as ViewProps)}>
          <Text {...(AssignUsersStyles.avatarFallbackTextStyles as TextProps)} fontSize="$sm">
            {getInitials(item.labelKey)}
          </Text>
        </Box>

          <VStack space="xs" flexShrink={1}>
          <Text {...(AssignUsersStyles.supervisorName as TextProps)} fontSize="$sm">
            {item.labelKey}
          </Text>
          {item.location && (
            <HStack gap="$1" alignItems="center">
              <LucideIcon
                name="MapPin"
                size={12}
                color={theme.tokens.colors.textMutedForeground}
              />
              <Text {...(AssignUsersStyles.provinceName as TextProps)} fontSize="$xs">
                {item.location}
              </Text>
            </HStack>
          )}
        </VStack>

          <Badge
            ml="auto"
            variant="outline"
            bg="$white"
            borderColor="$borderColor"
            px="$2"
            py="$1"
            borderRadius="$lg"
            mr="$2"
          >
            <BadgeText color="$textForeground" fontSize="$xs" textTransform="none">
              {t(`admin.assignUsers.status.${item.status || 'unassigned'}`) ||
                item.status ||
                t('admin.assignUsers.status.unassigned')}
            </BadgeText>
          </Badge>
        </HStack>
      ),
      desktopConfig: { showColumn: true, showLabel: false },
      mobileConfig: { showColumn: true, showLabel: false, fullWidthRank: 0 },
    },
  ], [selectedLCs, t]);

  const linkageChampionColumns: ColumnDef<any>[] = useMemo(() => [
    {
      key: 'lcInfo',
      label: 'admin.assignUsers.linkageChampion',
      align: 'left',
      flex: 1,
      render: (lc: any) => (
        <HStack
          {...(AssignUsersStyles.viewstyles as ViewProps)}
          flex={1}
          width="100%"
          alignItems="center"
          space="sm"
        >
          {/* Checkbox managed inside lcInfo (no separate checkbox column) */}
          <Checkbox
            value={lc.value}
            isChecked={selectedLCs.has(lc.value)}
            onChange={(checked: boolean) => {
              setSelectedLCs((prev) => {
                const newSet = new Set(prev);
                if (checked) newSet.add(lc.value);
                else newSet.delete(lc.value);
                return newSet;
              });
            }}
          >
            <CheckboxIndicator borderWidth={1} borderColor="$textForeground">
              <CheckboxIcon as={CheckIcon} color="$modalBackground" />
            </CheckboxIndicator>
          </Checkbox>

          <Box {...(AssignUsersStyles.initialsBoxSmStyles as ViewProps)}>
          <Text {...(AssignUsersStyles.avatarFallbackTextStyles as TextProps)} fontSize="$sm">
            {getInitials(lc.labelKey)}
          </Text>
        </Box>

          <VStack space="xs" flexShrink={1}>
            <Text {...(AssignUsersStyles.supervisorName as TextProps)} fontSize="$sm">
              {lc.labelKey}
            </Text>
            {lc.location && (
              <HStack gap="$1" alignItems="center">
                <LucideIcon
                  name="MapPin"
                  size={12}
                  color={theme.tokens.colors.textMutedForeground}
                />
                <Text {...(AssignUsersStyles.provinceName as TextProps)} fontSize="$xs">
                  {lc.location}
                </Text>
              </HStack>
            )}
          </VStack>
        </HStack>
      ),
      desktopConfig: { showColumn: true, showLabel: false },
      // On mobile card view, show LC info as the main full-width row
      mobileConfig: { showColumn: true, showLabel: false, leftRank: 0 },
    },
    {
      key: 'status',
      label: '',
      align: 'right',
      flex: 1,
      render: (lc: any) => (
        <HStack width="100%" justifyContent="flex-end">
          <Badge
            variant="outline"
            bg="$white"
            borderColor="$borderColor"
            px="$2"
            py="$1"
            borderRadius="$lg"
            mr="$2"
          >
            <BadgeText color="$textForeground" fontSize="$xs" textTransform="none">
              {t(`admin.assignUsers.status.${lc.status || 'unassigned'}`) ||
                lc.status ||
                t('admin.assignUsers.status.unassigned')}
            </BadgeText>
          </Badge>
        </HStack>
      ),
      desktopConfig: { showColumn: true, showLabel: false },
      // On mobile card view, place status on the right side of the first row (paired with LC info on the left)
      mobileConfig: { showColumn: true, showLabel: false, rightRank: 0 },
    },
  ], [selectedLCs, t]);
 // Handler to receive filter changes from FilterButton and pass to parent
 const handleFilterChange = (values: Record<string, any>) => {
   // Call parent's onChange handler if provided
   onChange?.(values);
 };


  return (
    <Card {...(AssignUsersStyles.coverCardStyles as ViewProps)}>
      <Heading {...(AssignUsersStyles.headingStyles as any)}>{t(title)}</Heading>
      <Text {...(AssignUsersStyles.descriptionTextStyles as TextProps)}>
        {(() => {
          const translatedDescription = t(description);

          if (translatedDescription.includes('{{supervisor}}') && selectedValues?.selectSupervisor) {
            return translatedDescription.replace('{{supervisor}}', selectedValues.selectSupervisor);
          }

          if (translatedDescription.includes('{{lc}}')) {
            const lc = selectedValues?.selectedLc;
            const lcName = lc?.labelKey || lc?.name || lc?.label || 'LC';
            return translatedDescription.replace('{{lc}}', lcName);
          }

          return translatedDescription;
        })()}
      </Text>


      {!showLcListforSupervisorTeam && (
        <FilterButton
          data={filterOptions}
          showClearButton={false}
          onFilterChange={handleFilterChange}
        />
      )}
     {/* Display selected values if showSelectedCard is true and values exist */}
     {showSelectedCard && selectedValues && (() => {
       
       const supervisorData = selectedValues.selectedSupervisorData;

        // Get supervisor name from API response (name field) or fallback to filter value
        const supervisorName =
        supervisorData?.name ||
        selectedValues.selectSupervisor ||
        selectedValues.selectedValue ||
        '';

        // Get initials from supervisor name using common utility function
        const supervisorInitials = getInitials(supervisorName);
        
        // Get province and site from supervisor API response
        const supervisorProvince = supervisorData?.province?.label || '';
        const supervisorSite = supervisorData?.local_municipality?.label || 
                              supervisorData?.site?.label ||
                              '';
        
        // Build location text: show both Province and Site if available
        const locationParts = [];
        if (supervisorSite) {
          locationParts.push(supervisorSite);
        }
        if (supervisorProvince) {
          locationParts.push(supervisorProvince);
        }
       
        const supervisorLocation = locationParts.join(' , ');
       
       return (
         <Card {...(AssignUsersStyles.cardStyles as ViewProps)}>
           <HStack space="md" alignItems="center">
              <Box {...(AssignUsersStyles.avatarBoxStyles as ViewProps)}>
                 <Text {...(AssignUsersStyles.avatarTextStyles as TextProps)}>{supervisorInitials}</Text>
              </Box>
             <View flex={1}>
               <Text {...(AssignUsersStyles.supervisorName as TextProps)}>
                 {supervisorName}
               </Text>
               {supervisorLocation && (
                 <Text {...(AssignUsersStyles.provinceName as TextProps)}>
                   {supervisorLocation}
                 </Text>
               )}
             </View>
           </HStack>
         </Card>
       );
     })()}
     {showLcList && (
       <VStack marginTop={'$3'}>
         <Text {...(AssignUsersStyles.provinceName as TextProps)} color="$textForeground">
           {isParticipantList 
             ? t('admin.assignUsers.selectParticipants', { count: selectedLCs.size })
             : t('admin.assignUsers.selectedLinkageChampions')}
         </Text>
        {isParticipantList ? (
          // Use DataTable for participants
          <Box marginTop="$1">
            <DataTable
              data={displayLCList || []}
              showHeader={false}
              columns={participantColumns}
              getRowKey={(item: any) => item.value}
              isLoading={isLoading}
              emptyMessage="common.noDataFound"
              responsive={true}
              onRowClick={(item: any) => {
                // Toggle checkbox selection on row click
                setSelectedLCs((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.value)) {
                    newSet.delete(item.value);
                  } else {
                    newSet.add(item.value);
                  }
                  return newSet;
                });
              }}
              pagination={{
                enabled: true,
                pageSize: pageSize,
                maxPageNumbers: 5,
                showPageSizeSelector: true,
                pageSizeOptions: [5, 10, 25, 50],
              }}
              onPageChange={(page: number) => {
                setCurrentPage(page);
              }}
              onPageSizeChange={(size: number) => {
                setPageSize(size);
                setCurrentPage(1); // Reset to first page when page size changes
              }}
            />
          </Box>
        ) : (
          <Box marginTop="$1">
            <DataTable
              data={displayLCList || []}
              showHeader={false}
              columns={linkageChampionColumns}
              getRowKey={(item: any) => item.value}
              isLoading={isLoading}
              emptyMessage="common.noDataFound"
              responsive={true}
              onRowClick={(item: any) => {
                // Toggle checkbox selection on row click
                setSelectedLCs((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(item.value)) newSet.delete(item.value);
                  else newSet.add(item.value);
                  return newSet;
                });
              }}
              pagination={{
                enabled: true,
                pageSize: pageSize,
                maxPageNumbers: 5,
                showPageSizeSelector: true,
                pageSizeOptions: [5, 10, 25, 50],
              }}
              onPageChange={(page: number) => {
                setCurrentPage(page);
              }}
              onPageSizeChange={(size: number) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </Box>
        )}


        <Button
          {...titleHeaderStyles.solidButton}
          mt={'$3'}
          onPress={() => {
            const selectedValuesArray = Array.from(selectedLCs);
            const selectedObjects = displayLCList.filter((item: any) =>
              selectedValuesArray.includes(item.value)
            );
            
            if (isParticipantList) {
              // Handle assign Participants to LC - show confirmation modal
              const lcData = selectedValues.selectedLc;
              
              // Store pending assignment and show modal
              setPendingAssignment({
                selectedParticipants: selectedObjects,
                lcData: lcData,
              });
            } else {
              // Handle assign LCs to supervisor - show confirmation modal
              const supervisorData = selectedValues.selectedSupervisorData;
              
              // Store pending assignment and show modal
              setPendingAssignment({
                selectedLCs: selectedObjects,
                supervisorData: supervisorData,
              });
            }
            setIsModalOpen(true);
          }}
          isDisabled={selectedLCs.size === 0}
        >
          <HStack space="sm" alignItems="center">
            <LucideIcon 
              name="CircleCheck" 
              size={20} 
              color={theme.tokens.colors.white || '#FFFFFF'} 
            />
            <Text {...titleHeaderStyles.solidButtonText}>
              {isParticipantList
                ? t('admin.assignUsers.assignParticipantsToLc').replace('{{count}}', String(selectedLCs.size))
                : t('admin.assignUsers.assignLCsToSupervisor').replace('{{count}}', String(selectedLCs.size))}
            </Text>
          </HStack>
        </Button>
        
        {/* Confirmation Modal for LC to Supervisor */}
        {!isParticipantList && pendingAssignment && pendingAssignment.selectedLCs && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setPendingAssignment(null);
            }}
            headerTitle={t('admin.assignUsers.confirmLcAssignment')}
            cancelButtonText={t('common.cancel')}
            confirmButtonText={t('admin.assignUsers.confirmAssignment')}
            onCancel={() => {
              setIsModalOpen(false);
              setPendingAssignment(null);
            }}
            onConfirm={async () => {
              try {
                // Call parent's onAssign callback if provided (await if it's async)
                if (onAssign && pendingAssignment.selectedLCs) {
                  await onAssign(pendingAssignment.selectedLCs);
                  // Clear selection only after successful assignment
                  setSelectedLCs(new Set());
                  
                  // Show success alert
                  const supervisorName = pendingAssignment.supervisorData?.name || 
                                        selectedValues.selectSupervisor || 
                                        'Supervisor';
                  const count = pendingAssignment.selectedLCs.length;
                  const successMessage = t('admin.assignUsers.lcsAssignedSuccess')
                    .replace('{{count}}', String(count))
                    .replace('{{supervisor}}', supervisorName);
                  showAlert(
                    'success',
                    successMessage,
                    { placement: 'bottom', duration: 5000 }
                  );
                }
                
                // Close modal
                setIsModalOpen(false);
                setPendingAssignment(null);
              } catch (error) {
                console.error('Error in onAssign callback:', error);
                // Show error alert
                showAlert(
                  'error',
                  t('admin.assignUsers.lcsAssignmentError'),
                  { placement: 'bottom', duration: 5000 }
                );
                // Don't clear selection on error
                // Don't close modal on error so user can retry
              }
            }}
            confirmButtonColor={theme.tokens.colors.primary500}
          >
            <VStack space="md">
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                {t('admin.assignUsers.confirmLcAssignmentDescription')
                  .replace('{{count}}', String(pendingAssignment.selectedLCs.length))
                  .replace('{{supervisor}}', pendingAssignment.supervisorData?.name || 
                           selectedValues.selectSupervisor || 
                           'Supervisor')}
              </Text>
              
              {/* Supervisor Information */}
              <HStack space="xs">
                <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
                  {t('admin.assignUsers.supervisor')}:
                </Text>
                <Text {...TYPOGRAPHY.bodySmall} color="$textForeground" fontWeight="$medium">
                  {pendingAssignment.supervisorData?.name || 
                   selectedValues.selectSupervisor || 
                   'Supervisor'}
                </Text>
              </HStack>
              
              {/* Linkage Champions List */}
              <VStack space="xs">
                <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
                  {t('admin.assignUsers.linkageChampions')}:
                </Text>
                <VStack space="xs" marginLeft="$4">
                  {pendingAssignment.selectedLCs.map((lc: any, index: number) => (
                    <HStack key={`${lc.value}-${index}`} space="sm" alignItems="center">
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground" fontWeight="$medium">
                        • {lc.labelKey}
                        {lc.location && ` (${lc.location})`}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </VStack>
          </Modal>
        )}

        {/* Confirmation Modal for Participant to LC */}
        {isParticipantList && pendingAssignment && pendingAssignment.selectedParticipants && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setPendingAssignment(null);
            }}
            headerTitle={t('admin.assignUsers.confirmParticipantAssignment')}
            cancelButtonText={t('common.cancel')}
            confirmButtonText={t('admin.assignUsers.confirmAssignment')}
            onCancel={() => {
              setIsModalOpen(false);
              setPendingAssignment(null);
            }}
            onConfirm={async () => {
              try {
                // Call parent's onAssign callback if provided (await if it's async)
                if (onAssign && pendingAssignment.selectedParticipants) {
                  await onAssign(pendingAssignment.selectedParticipants);
                  // Clear selection only after successful assignment
                  setSelectedLCs(new Set());
                  
                  // Show success alert
                  const lcName = pendingAssignment.lcData?.labelKey || 
                                selectedValues.selectedLc?.labelKey ||
                                'LC';
                  const count = pendingAssignment.selectedParticipants.length;
                  const successMessage = t('admin.assignUsers.participantsAssignedSuccess')
                    .replace('{{count}}', String(count))
                    .replace('{{lc}}', lcName);
                  showAlert(
                    'success',
                    successMessage,
                    { placement: 'bottom', duration: 5000 }
                  );
                }
                
                // Close modal
                setIsModalOpen(false);
                setPendingAssignment(null);
              } catch (error) {
                console.error('Error in onAssign callback:', error);
                // Show error alert
                showAlert(
                  'error',
                  t('admin.assignUsers.participantsAssignmentError'),
                  { placement: 'bottom', duration: 5000 }
                );
                // Don't clear selection on error
                // Don't close modal on error so user can retry
              }
            }}
            confirmButtonColor={theme.tokens.colors.primary500}
          >
            <VStack space="md">
              <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground">
                {t('admin.assignUsers.confirmParticipantAssignmentDescription')
                  .replace('{{count}}', String(pendingAssignment.selectedParticipants?.length || 0))
                  .replace('{{lc}}', pendingAssignment.lcData?.labelKey || 
                           selectedValues.selectedLc?.labelKey ||
                           'LC')}
              </Text>
              
              {/* Linkage Champion Information */}
              <HStack space="xs">
                <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
                  {t('admin.assignUsers.linkageChampion')}:
                </Text>
                <Text {...TYPOGRAPHY.bodySmall} color="$textForeground" fontWeight="$medium">
                  {pendingAssignment.lcData?.labelKey || 
                   selectedValues.selectedLc?.labelKey ||
                   'LC'}
                </Text>
              </HStack>
              
              {/* Participants List */}
              <VStack space="xs">
                <Text {...TYPOGRAPHY.bodySmall} color="$textMutedForeground" fontWeight="$normal">
                  {t('admin.assignUsers.participants')}:
                </Text>
                <VStack space="xs" marginLeft="$4">
                  {pendingAssignment.selectedParticipants?.map((participant: any, index: number) => (
                    <HStack key={`${participant.value}-${index}`} space="sm" alignItems="center">
                      <Text {...TYPOGRAPHY.bodySmall} color="$textForeground" fontWeight="$medium">
                        • {participant.labelKey}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </VStack>
          </Modal>
        )}
       </VStack>
     )}


     {showLcListforSupervisorTeam &&
       displayLCList?.map((lc: any) => {
         const isSelected = selectedLc?.value === lc.value;


         return (
           <Pressable
             key={lc.value}
             onPress={() => {
               setSelectedLc(lc); // local highlight
               onLcSelect?.(lc); // notify parent
             }}
            >
              <Card
               {...(isSelected
                 ? (AssignUsersStyles.cardStyles as ViewProps)
                 : (AssignUsersStyles.selectedCardStyles as ViewProps))}
             >
                <Box
                  {...(AssignUsersStyles.initialsBoxSmStyles as ViewProps)}
                >
                  <Text {...(AssignUsersStyles.avatarFallbackTextStyles as TextProps)} fontSize="$sm">
                    {getInitials(lc.labelKey || '')}
                  </Text>
                </Box>


               <View>
                 <Text {...(AssignUsersStyles.supervisorName as TextProps)}>
                   {lc.labelKey}
                 </Text>
                 <Text {...(AssignUsersStyles.provinceName as TextProps)}>
                   {lc.location}
                 </Text>
               </View>
             </Card>
           </Pressable>
         );
       })}
   </Card>
 );
};


export default UserAvatarCard;