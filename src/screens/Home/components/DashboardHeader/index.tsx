import React from 'react';
import { Box, HStack, VStack, Text, Select } from '@ui';
import { dashboardHeaderStyles } from './Styles';

interface DashboardHeaderProps {
  selectedTime?: string;
  selectedProvince?: string;
  selectedSite?: string;
  selectedGender?: string;
  onTimeChange?: (value: string) => void;
  onProvinceChange?: (value: string) => void;
  onSiteChange?: (value: string) => void;
  onGenderChange?: (value: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedTime = 'All Time',
  selectedProvince = 'All Provinces',
  selectedSite = 'All Sites',
  selectedGender = 'All Gender',
  onTimeChange,
  onProvinceChange,
  onSiteChange,
  onGenderChange,
}) => {
  const timeOptions = [
    'All Time',
    'Last 7 Days',
    'Last 30 Days',
    'Last 90 Days',
    'This Year',
  ];

  const provinceOptions = [
    'All Provinces',
    'Gauteng',
    'Western Cape',
    'KwaZulu-Natal',
    'Eastern Cape',
  ];

  const siteOptions = [
    'All Sites',
    'Site A',
    'Site B',
    'Site C',
  ];

  const genderOptions = [
    'All Gender',
    'Male',
    'Female',
    'Other',
  ];

  return (
    <VStack {...dashboardHeaderStyles.container}>
      <HStack {...dashboardHeaderStyles.filtersContainer}>
        <Box {...dashboardHeaderStyles.filterItem}>
          <Select
            options={timeOptions}
            value={selectedTime}
            onChange={(value) => onTimeChange?.(value)}
            placeholder="All Time"
          />
        </Box>
        <Box {...dashboardHeaderStyles.filterItem}>
          <Select
            options={provinceOptions}
            value={selectedProvince}
            onChange={(value) => onProvinceChange?.(value)}
            placeholder="All Provinces"
          />
        </Box>
        <Box {...dashboardHeaderStyles.filterItem}>
          <Select
            options={siteOptions}
            value={selectedSite}
            onChange={(value) => onSiteChange?.(value)}
            placeholder="All Sites"
          />
        </Box>
        <Box {...dashboardHeaderStyles.filterItem}>
          <Select
            options={genderOptions}
            value={selectedGender}
            onChange={(value) => onGenderChange?.(value)}
            placeholder="All Gender"
          />
        </Box>
      </HStack>
    </VStack>
  );
};

export default DashboardHeader;

