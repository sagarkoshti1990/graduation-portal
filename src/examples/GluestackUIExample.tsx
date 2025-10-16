/**
 * GluestackUIExample
 * Demonstrates various gluestack-ui components and features
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import Layout from '../components/layout/Layout';
import Alert from '../components/ui/alert';

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

  return (
    <Layout
      title="Gluestack UI Examples"
      statusBarStyle="dark-content"
      statusBarBackgroundColor="#FFFFFF"
    >
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'components' && styles.activeTab]}
          onPress={() => setSelectedTab('components')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'components' && styles.activeTabText,
            ]}
          >
            Components
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'forms' && styles.activeTab]}
          onPress={() => setSelectedTab('forms')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'forms' && styles.activeTabText,
            ]}
          >
            Forms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'feedback' && styles.activeTab]}
          onPress={() => setSelectedTab('feedback')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'feedback' && styles.activeTabText,
            ]}
          >
            Feedback
          </Text>
        </TouchableOpacity>
      </View>

      {/* Components Tab */}
      {selectedTab === 'components' && (
        <View>
          {/* Cards Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cards</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Simple Card</Text>
              <Text style={styles.cardDescription}>
                This is a basic card component with title and description.
              </Text>
            </View>

            <View style={[styles.card, styles.elevatedCard]}>
              <Text style={styles.cardTitle}>Elevated Card</Text>
              <Text style={styles.cardDescription}>
                This card has elevation/shadow for depth.
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.cardButton}>
                  <Text style={styles.cardButtonText}>Action 1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardButton, styles.secondaryButton]}
                >
                  <Text style={styles.secondaryButtonText}>Action 2</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Buttons Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buttons</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Primary</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButtonOutline}>
                <Text style={styles.secondaryButtonOutlineText}>Secondary</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.successButton}>
                <Text style={styles.primaryButtonText}>Success</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerButton}>
                <Text style={styles.primaryButtonText}>Danger</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.outlinedButton}>
              <Text style={styles.outlinedButtonText}>Outlined Button</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.disabledButton} disabled>
              <Text style={styles.disabledButtonText}>Disabled Button</Text>
            </TouchableOpacity>
          </View>

          {/* Chips Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chips / Badges</Text>

            <View style={styles.chipContainer}>
              {chips.map(chip => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.chip,
                    selectedChip === chip.id && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedChip(chip.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedChip === chip.id && styles.chipTextSelected,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgePrimary]}>
                <Text style={styles.badgeText}>Primary</Text>
              </View>
              <View style={[styles.badge, styles.badgeSuccess]}>
                <Text style={styles.badgeText}>Success</Text>
              </View>
              <View style={[styles.badge, styles.badgeWarning]}>
                <Text style={styles.badgeText}>Warning</Text>
              </View>
              <View style={[styles.badge, styles.badgeDanger]}>
                <Text style={styles.badgeText}>Danger</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Forms Tab */}
      {selectedTab === 'forms' && (
        <View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Form Controls</Text>

            {/* Text Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={textValue}
                onChangeText={setTextValue}
                keyboardType="email-address"
              />
              <Text style={styles.helperText}>
                We'll never share your email.
              </Text>
            </View>

            {/* Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            {/* Text Area */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your message"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Switch */}
            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Enable notifications</Text>
                <Switch
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={isEnabled ? '#007AFF' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={toggleSwitch}
                  value={isEnabled}
                />
              </View>
              <Text style={styles.helperText}>
                {isEnabled
                  ? 'Notifications are enabled'
                  : 'Notifications are disabled'}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={showSuccessAlert}
            >
              <Text style={styles.primaryButtonText}>Submit Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Feedback Tab */}
      {selectedTab === 'feedback' && (
        <View>
          {/* Alerts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alerts & Notifications</Text>

            <View style={[styles.alert, styles.alertInfo]}>
              <Text style={styles.alertTitle}>ℹ️ Information</Text>
              <Text style={styles.alertDescription}>
                This is an informational alert message.
              </Text>
            </View>

            <View style={[styles.alert, styles.alertSuccess]}>
              <Text style={styles.alertTitle}>✓ Success</Text>
              <Text style={styles.alertDescription}>
                Your action was completed successfully!
              </Text>
            </View>

            <View style={[styles.alert, styles.alertWarning]}>
              <Text style={styles.alertTitle}>⚠️ Warning</Text>
              <Text style={styles.alertDescription}>
                Please review your input carefully.
              </Text>
            </View>

            <View style={[styles.alert, styles.alertError]}>
              <Text style={styles.alertTitle}>✕ Error</Text>
              <Text style={styles.alertDescription}>
                Something went wrong. Please try again.
              </Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Indicators</Text>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>25% Complete</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '25%' }]} />
              </View>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>50% Complete</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    styles.progressSuccess,
                    { width: '50%' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>75% Complete</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    styles.progressWarning,
                    { width: '75%' },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Dialog Trigger */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dialogs & Modals</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={showSuccessAlert}
            >
              <Text style={styles.primaryButtonText}>Show Alert Dialog</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
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
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  elevatedCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  cardButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
  },
  cardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonOutline: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6C757D',
  },
  secondaryButtonOutlineText: {
    color: '#6C757D',
    fontSize: 16,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: 12,
  },
  outlinedButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButtonText: {
    color: '#ADB5BD',
    fontSize: 16,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgePrimary: {
    backgroundColor: '#007AFF',
  },
  badgeSuccess: {
    backgroundColor: '#28A745',
  },
  badgeWarning: {
    backgroundColor: '#FFC107',
  },
  badgeDanger: {
    backgroundColor: '#DC3545',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#2C3E50',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#28A745',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  alert: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertInfo: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  alertSuccess: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  alertWarning: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  alertError: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#495057',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressSuccess: {
    backgroundColor: '#28A745',
  },
  progressWarning: {
    backgroundColor: '#FFC107',
  },
});

export default GluestackUIExample;
