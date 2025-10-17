/**
 * GluestackUIExample
 * Demonstrates various gluestack-ui components and features
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Input,
  InputField,
  Switch,
  Pressable,
  Heading,
} from '@gluestack-ui/themed';
import { ViewStyle, TextStyle } from 'react-native';
import Layout from '../components/layout/Layout';
import Alert from '../components/ui/alert';
import ResponsiveCardList from '../components/responsive-card-list';

const GluestackUIExample: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [selectedTab, setSelectedTab] = useState('components');
  const [selectedChip, setSelectedChip] = useState<string>('all');

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  const showSuccessAlert = () => {
    Alert.alert('Success!', 'This is a gluestack-ui styled alert', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: () => console.log('OK Pressed') },
    ]);
  };

  const chips = [
    { id: 'all', label: 'All' },
    { id: 'react', label: 'React' },
    { id: 'native', label: 'Native' },
    { id: 'web', label: 'Web' },
  ];

  // Sample data for ResponsiveCardList
  const sampleUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'active',
      age: 32,
      isVerified: true,
      joinedDate: '2023-01-15',
      projects: 12,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Developer',
      status: 'active',
      age: 28,
      isVerified: true,
      joinedDate: '2023-03-22',
      projects: 8,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      role: 'Designer',
      status: 'inactive',
      age: 35,
      isVerified: false,
      joinedDate: '2023-02-10',
      projects: 5,
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah.w@example.com',
      role: 'Manager',
      status: 'active',
      age: 40,
      isVerified: true,
      joinedDate: '2022-11-05',
      projects: 15,
    },
    {
      id: '5',
      name: 'Tom Brown',
      email: 'tom.brown@example.com',
      role: 'Developer',
      status: 'active',
      age: 26,
      isVerified: true,
      joinedDate: '2023-06-18',
      projects: 6,
    },
    {
      id: '6',
      name: 'Emily Davis',
      email: 'emily.d@example.com',
      role: 'Tester',
      status: 'active',
      age: 29,
      isVerified: true,
      joinedDate: '2023-04-12',
      projects: 10,
    },
  ];

  // Item key map configuration
  const userKeyMap = [
    { key: 'name', label: 'Name', type: 'string' as const, sortable: true },
    { key: 'email', label: 'Email', type: 'string' as const, sortable: true },
  ];

  const tabContainerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  };

  const getTabStyle = (isActive: boolean): ViewStyle => ({
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: isActive ? 'red' : 'transparent',
    alignItems: 'center',
  });

  const getTabTextStyle = (isActive: boolean): TextStyle => ({
    fontSize: 14,
    fontWeight: '600',
    color: isActive ? '#fff' : '#6C757D',
  });

  const sectionStyle: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  };

  return (
    <Layout
      title="Gluestack UI Examples"
      statusBarStyle="dark-content"
      statusBarBackgroundColor="#FFFFFF"
    >
      {/* Tab Navigation */}
      <HStack style={tabContainerStyle}>
        <Pressable
          style={getTabStyle(selectedTab === 'components')}
          onPress={() => setSelectedTab('components')}
        >
          <Text style={getTabTextStyle(selectedTab === 'components')}>
            Components
          </Text>
        </Pressable>
        <Pressable
          style={getTabStyle(selectedTab === 'forms')}
          onPress={() => setSelectedTab('forms')}
        >
          <Text style={getTabTextStyle(selectedTab === 'forms')}>Forms</Text>
        </Pressable>
        <Pressable
          style={getTabStyle(selectedTab === 'feedback')}
          onPress={() => setSelectedTab('feedback')}
        >
          <Text style={getTabTextStyle(selectedTab === 'feedback')}>
            Feedback
          </Text>
        </Pressable>
        <Pressable
          style={getTabStyle(selectedTab === 'responsive')}
          onPress={() => setSelectedTab('responsive')}
        >
          <Text style={getTabTextStyle(selectedTab === 'responsive')}>
            Responsive
          </Text>
        </Pressable>
      </HStack>

      {/* Components Tab */}
      {selectedTab === 'components' && (
        <VStack style={{ gap: 16 }}>
          {/* Cards Section */}
          <Box style={sectionStyle}>
            <Heading
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#2C3E50',
                marginBottom: 16,
              }}
            >
              Cards
            </Heading>

            <Box
              style={{
                backgroundColor: '#F8F9FA',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E9ECEF',
              }}
            >
              <Heading
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#2C3E50',
                  marginBottom: 8,
                }}
              >
                Simple Card
              </Heading>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6C757D',
                }}
              >
                This is a basic card component with title and description.
              </Text>
            </Box>

            <Box
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Heading
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#2C3E50',
                  marginBottom: 8,
                }}
              >
                Elevated Card
              </Heading>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6C757D',
                  marginBottom: 16,
                }}
              >
                This card has elevation/shadow for depth.
              </Text>
              <HStack style={{ gap: 8 }}>
                <Button
                  style={{
                    flex: 1,
                    backgroundColor: 'red',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <ButtonText style={{ color: '#fff' }}>Action 1</ButtonText>
                </Button>
                <Button
                  style={{
                    flex: 1,
                    backgroundColor: '#6C757D',
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  <ButtonText style={{ color: '#fff' }}>Action 2</ButtonText>
                </Button>
              </HStack>
            </Box>
          </Box>

          {/* Buttons Section */}
          <Box style={sectionStyle}>
            <Heading
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#2C3E50',
                marginBottom: 16,
              }}
            >
              Buttons
            </Heading>

            <HStack style={{ gap: 8, marginBottom: 12 }}>
              <Button
                style={{
                  flex: 1,
                  backgroundColor: 'red',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
              >
                <ButtonText
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Primary
                </ButtonText>
              </Button>
              <Button
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderWidth: 2,
                  borderColor: '#6C757D',
                }}
              >
                <ButtonText
                  style={{
                    color: '#6C757D',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Secondary
                </ButtonText>
              </Button>
            </HStack>

            <HStack style={{ gap: 8, marginBottom: 12 }}>
              <Button
                style={{
                  flex: 1,
                  backgroundColor: '#28A745',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
              >
                <ButtonText
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Success
                </ButtonText>
              </Button>
              <Button
                style={{
                  flex: 1,
                  backgroundColor: '#DC3545',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
              >
                <ButtonText
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Danger
                </ButtonText>
              </Button>
            </HStack>

            <Button
              style={{
                backgroundColor: 'transparent',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderWidth: 2,
                borderColor: 'red',
                marginBottom: 12,
              }}
            >
              <ButtonText
                style={{
                  color: 'red',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Outlined Button
              </ButtonText>
            </Button>

            <Button
              isDisabled
              style={{
                backgroundColor: '#E9ECEF',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              <ButtonText
                style={{
                  color: '#6C757D',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Disabled Button
              </ButtonText>
            </Button>
          </Box>

          {/* Chips Section */}
          <Box style={sectionStyle}>
            <Heading
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#2C3E50',
                marginBottom: 16,
              }}
            >
              Chips / Badges
            </Heading>

            <HStack
              style={{
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {chips.map(chip => (
                <Pressable
                  key={chip.id}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor:
                      selectedChip === chip.id ? 'red' : '#E9ECEF',
                    borderWidth: 1,
                    borderColor: selectedChip === chip.id ? 'red' : '#DEE2E6',
                  }}
                  onPress={() => setSelectedChip(chip.id)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: selectedChip === chip.id ? '#fff' : '#2C3E50',
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </HStack>

            <HStack style={{ flexWrap: 'wrap', gap: 8 }}>
              <Box
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: 'red',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#fff',
                  }}
                >
                  Primary
                </Text>
              </Box>
              <Box
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: '#28A745',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#fff',
                  }}
                >
                  Success
                </Text>
              </Box>
              <Box
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: '#FFC107',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#fff',
                  }}
                >
                  Warning
                </Text>
              </Box>
              <Box
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: '#DC3545',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#fff',
                  }}
                >
                  Danger
                </Text>
              </Box>
            </HStack>
          </Box>
        </VStack>
      )}

      {/* Forms Tab */}
      {selectedTab === 'forms' && (
        <VStack style={{ gap: 16 }}>
          <Box style={sectionStyle}>
            <Heading
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#2C3E50',
                marginBottom: 16,
              }}
            >
              Form Controls
            </Heading>

            {/* Text Input */}
            <VStack style={{ gap: 4, marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#2C3E50',
                }}
              >
                Email Address
              </Text>
              <Input
                style={{
                  backgroundColor: '#F8F9FA',
                  borderWidth: 1,
                  borderColor: '#DEE2E6',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
              >
                <InputField
                  placeholder="Enter your email"
                  placeholderTextColor={'#999'}
                  value={textValue}
                  onChangeText={setTextValue}
                  keyboardType="email-address"
                  style={{
                    fontSize: 14,
                    color: '#2C3E50',
                  }}
                />
              </Input>
              <Text
                style={{
                  fontSize: 12,
                  color: '#6C757D',
                }}
              >
                We'll never share your email.
              </Text>
            </VStack>

            {/* Password Input */}
            <VStack style={{ gap: 4, marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#2C3E50',
                }}
              >
                Password
              </Text>
              <Input
                style={{
                  backgroundColor: '#F8F9FA',
                  borderWidth: 1,
                  borderColor: '#DEE2E6',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
              >
                <InputField
                  placeholder="Enter password"
                  placeholderTextColor={'#999'}
                  secureTextEntry
                  style={{
                    fontSize: 14,
                    color: '#2C3E50',
                  }}
                />
              </Input>
            </VStack>

            {/* Text Area */}
            <VStack style={{ gap: 4, marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#2C3E50',
                }}
              >
                Message
              </Text>
              <Input
                style={{
                  backgroundColor: '#F8F9FA',
                  borderWidth: 1,
                  borderColor: '#DEE2E6',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  height: 100,
                }}
              >
                <InputField
                  placeholder="Enter your message"
                  placeholderTextColor={'#999'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{
                    fontSize: 14,
                    color: '#2C3E50',
                  }}
                />
              </Input>
            </VStack>

            {/* Switch */}
            <VStack style={{ gap: 4, marginBottom: 32 }}>
              <HStack
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#2C3E50',
                  }}
                >
                  Enable notifications
                </Text>
                <Switch value={isEnabled} onValueChange={toggleSwitch} />
              </HStack>
              <Text
                style={{
                  fontSize: 12,
                  color: '#6C757D',
                }}
              >
                {isEnabled
                  ? 'Notifications are enabled'
                  : 'Notifications are disabled'}
              </Text>
            </VStack>

            {/* Submit Button */}
            <Button
              style={{
                backgroundColor: '#28A745',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
              onPress={showSuccessAlert}
            >
              <ButtonText
                style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Submit Form
              </ButtonText>
            </Button>
          </Box>
        </VStack>
      )}

      {/* Feedback Tab */}
      {selectedTab === 'feedback' && (
        <VStack style={{ gap: 16 }}>
          {/* Alerts Section */}
          <Box style={sectionStyle}>
            <Heading
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#2C3E50',
                marginBottom: 16,
              }}
            >
              Alerts & Notifications
            </Heading>

            <Box
              style={{
                backgroundColor: '#E3F2FD',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#2196F3',
              }}
            >
              <Heading
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#2C3E50',
                  marginBottom: 4,
                }}
              >
                ℹ️ Information
              </Heading>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6C757D',
                }}
              >
                This is an informational alert message.
              </Text>
            </Box>

            <Box
              style={{
                backgroundColor: '#E8F5E9',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#4CAF50',
              }}
            >
              <Heading
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#2C3E50',
                  marginBottom: 4,
                }}
              >
                ✓ Success
              </Heading>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6C757D',
                }}
              >
                Your action was completed successfully!
              </Text>
            </Box>

            <Box
              style={{
                backgroundColor: '#FFF3E0',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: '#FF9800',
              }}
            >
              <Heading
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#2C3E50',
                  marginBottom: 4,
                }}
              >
                ⚠️ Warning
              </Heading>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6C757D',
                }}
              >
                Please review your input carefully.
              </Text>
            </Box>

            <Box
              style={{
                backgroundColor: '#FFEBEE',
                borderRadius: 8,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: '#F44336',
              }}
            >
              <Heading
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#2C3E50',
                  marginBottom: 4,
                }}
              >
                ✕ Error
              </Heading>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6C757D',
                }}
              >
                Something went wrong. Please try again.
              </Text>
            </Box>
          </Box>

          {/* Progress Section */}
          <Box style={sectionStyle}>
            <Heading
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#2C3E50',
                marginBottom: 16,
              }}
            >
              Progress Indicators
            </Heading>

            <VStack style={{ gap: 8, marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#2C3E50',
                }}
              >
                25% Complete
              </Text>
              <Box
                style={{
                  height: 8,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    width: '25%',
                    height: '100%',
                    backgroundColor: 'red',
                    borderRadius: 4,
                  }}
                />
              </Box>
            </VStack>

            <VStack style={{ gap: 8, marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#2C3E50',
                }}
              >
                50% Complete
              </Text>
              <Box
                style={{
                  height: 8,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    width: '50%',
                    height: '100%',
                    backgroundColor: '#28A745',
                    borderRadius: 4,
                  }}
                />
              </Box>
            </VStack>

            <VStack style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#2C3E50',
                }}
              >
                75% Complete
              </Text>
              <Box
                style={{
                  height: 8,
                  backgroundColor: '#F8F9FA',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    width: '75%',
                    height: '100%',
                    backgroundColor: '#FFC107',
                    borderRadius: 4,
                  }}
                />
              </Box>
            </VStack>
          </Box>

          {/* Dialog Trigger */}
          <Box style={sectionStyle}>
            <Heading
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#2C3E50',
                marginBottom: 16,
              }}
            >
              Dialogs & Modals
            </Heading>

            <Button
              style={{
                backgroundColor: 'red',
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
              onPress={showSuccessAlert}
            >
              <ButtonText
                style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Show Alert Dialog
              </ButtonText>
            </Button>
          </Box>
        </VStack>
      )}

      {/* Responsive Tab */}
      {selectedTab === 'responsive' && (
        <Box style={{ flex: 1 }}>
          <ResponsiveCardList
            data={sampleUsers}
            itemKeyMap={userKeyMap}
            storage_key_name="example_users_list"
            card_title="List of Users"
            showDownload={true}
            enableSearch={true}
            enableFilter={true}
            enableSort={true}
            enableOfflineMode={true}
            onItemClick={item => {
              Alert.alert('User Selected', `You clicked on ${item.name}`, [
                { text: 'OK' },
              ]);
            }}
            onDownload={item => {
              console.log('Downloading user:', item);
            }}
          />
        </Box>
      )}
    </Layout>
  );
};

export default GluestackUIExample;
