import React, { useState } from 'react';
import { Box, Button, ButtonIcon, ButtonText, Container, HStack, LucideIcon, VStack } from '@ui';
import styles from './styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import { TabButton } from '@components/Tabs';
import FilterButton from '@components/Filter';
import TrainingCard from './components/Cards/TrainingCard';
import AdditionalServicesCard from './components/Cards/AdditionalServicesCard';
import AssetCard from './components/Cards/AssetCard';

const filterOptions = [
  {
    type: 'search',
    attr: 'search',
    placeholderKey: 'admin.filters.searchOfferingsPlaceholder',
  },
  {
    type: 'select',
    attr: 'status',
    placeholder: 'All Statuses',
    data: [
      { label: 'All Statuses', value: 'all-statuses' },
      { label: 'Pending', value: 'Pending' },
      { label: 'Accepted', value: 'Accepted' },
      { label: 'Rejected', value: 'Rejected' },
    ],
  },
  {
    type: 'select',
    attr: 'province',
    placeholder: 'All Provinces',
    data: [
      { label: 'All Provinces', value: 'all-provinces' },
      { label: 'Gauteng', value: 'Gauteng' },
      { label: 'Western Cape', value: 'Western Cape' },
      { label: 'KwaZulu-Natal', value: 'KwaZulu-Natal' },
      { label: 'Limpopo', value: 'Limpopo' },
    ],
  },
  {
    type: 'select',
    attr: 'site',
    placeholder: 'All Sites',
    data: [
      { label: 'All Sites', value: 'all-sites' },
      { label: 'Tshwane Community Hub', value: 'tshwane-hub' },
      { label: 'Cape Town Enterprise Office', value: 'ct-office' },
      { label: 'Johannesburg Civic Center', value: 'joburg-center' },
      { label: 'BRAC Gauteng Hub', value: 'gauteng-hub' },
      { label: 'BRAC KwaZulu-Natal Hub', value: 'kzn-hub' },
    ],
  },
];

const TABS = [
  {
    key: 'sessions',
    label: 'Trainings & Sessions (6)',
    icon: 'GraduationCap',
  },
  {
    key: 'additional_services',
    label: 'Additional Services (3)',
    icon: 'Briefcase',
  },
  {
    key: 'assets',
    label: 'Assets (4)',
    icon: 'Box',
  },
];

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('sessions');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title="My Support Offerings"
        subTitle="Manage all published support — training sessions, services, and assets"
        rightSection={
          <Button
            onPress={() => navigation.navigate('create-opportunity' as never)}
          >
            <ButtonIcon as={LucideIcon} name={'Plus'} />
            <ButtonText>Create New</ButtonText>
          </Button>
        }
      />
      <Box
        bg="$white"
        borderBottomWidth={1}
        borderBottomColor="$borderLight100"
      >
        <Container>
          <HStack
            alignItems="center"
            space="sm"
          >
            {TABS.map((tab) => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={(key) => setActiveTab(key)}
              />
            ))}
          </HStack>
        </Container>
      </Box>

      <Container {...styles.container}>
        <VStack space="lg" width="100%">
          <FilterButton
            data={filterOptions}
            onFilterChange={handleFilterChange}
            showClearButton={false}
          />

          {activeTab === 'sessions' && <TrainingCard />}
          {activeTab === 'additional_services' && <AdditionalServicesCard />}
          {activeTab === 'assets' && <AssetCard />}
        </VStack>
      </Container>
    </VStack>
  );
};

export default App;
