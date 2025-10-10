import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SyncService } from '../services/SyncService';
import { SyncStatusData, Task, Evidence } from '../types';
import { UploadedFile } from '../services/FileUploadService';
import { StorageService } from '../services/StorageService';
import FileUploadModal from '../components/FileUploadModal';
import Alert from '../components/ui/alert';
interface SyncStatusScreenProps {
  navigation: any;
}

const SyncStatusScreen: React.FC<SyncStatusScreenProps> = ({ navigation }) => {
  const [syncData, setSyncData] = useState<SyncStatusData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'tasks' | 'evidence'>(
    'all',
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | Evidence | null>(
    null,
  );

  const loadSyncData = useCallback(async () => {
    try {
      const data = await SyncService.getSyncStatusData();
      setSyncData(data);
    } catch (error) {
      console.error('Error loading sync data:', error);
      Alert.alert('Error', 'Failed to load sync data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSyncData();
  }, [loadSyncData]);

  const handleManualSync = async () => {
    if (!syncData?.isOnline) {
      Alert.alert(
        'No Connection',
        'Please check your internet connection and try again.',
      );
      return;
    }

    if (syncData.pendingItems === 0) {
      Alert.alert('All Synced', 'All items are already synced!');
      return;
    }

    try {
      setIsSyncing(true);
      const result = await SyncService.manualSync();

      if (result.success) {
        Alert.alert(
          'Sync Successful',
          `Synced ${result.syncedTasks} tasks and ${result.syncedEvidence} evidence items.`,
        );
      } else {
        Alert.alert(
          'Sync Failed',
          `Errors: ${result.errors.join(', ')}\n\nFailed tasks: ${
            result.failedTasks.length
          }\nFailed evidence: ${result.failedEvidence.length}`,
        );
      }

      // Reload data after sync
      await loadSyncData();
    } catch (error) {
      console.error('Error during sync:', error);
      Alert.alert('Error', 'An error occurred during sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleItemPress = useCallback((item: Task | Evidence) => {
    setSelectedItem(item);
    setShowUploadModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowUploadModal(false);
    setSelectedItem(null);
  }, []);

  const handleFileSelect = useCallback(
    async (file: UploadedFile) => {
      if (!selectedItem) return;

      try {
        // Get taskId - if it's a task, use its id, if it's evidence, use its taskId
        const taskId =
          'projectId' in selectedItem ? selectedItem.id : selectedItem.taskId;

        // Create new evidence
        const newEvidence: Evidence = {
          id: `evidence-${Date.now()}`,
          taskId: taskId,
          type: file.type.startsWith('image/') ? 'photo' : 'document',
          fileName: file.name,
          filePath: file.uri,
          uploadedAt: new Date(),
          needsSync: true,
          syncStatus: 'pending',
        };

        await StorageService.addEvidence(newEvidence);
        await loadSyncData();
        console.log('Evidence saved successfully:', newEvidence);
      } catch (error) {
        console.error('Error saving evidence:', error);
        Alert.alert('Error', 'Failed to save evidence');
      }
    },
    [selectedItem, loadSyncData],
  );

  const getSyncStatusColor = (
    status?: 'pending' | 'syncing' | 'synced' | 'failed',
  ) => {
    switch (status) {
      case 'synced':
        return '#28A745';
      case 'syncing':
        return '#007BFF';
      case 'pending':
        return '#FFC107';
      case 'failed':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const getSyncStatusLabel = (
    status?: 'pending' | 'syncing' | 'synced' | 'failed',
  ) => {
    switch (status) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const statusColor = getSyncStatusColor(item.syncStatus);
    const statusLabel = getSyncStatusLabel(item.syncStatus);

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemType}>📋 Task</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        {item.syncError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {item.syncError}</Text>
          </View>
        )}
        {item.lastSyncedAt && (
          <Text style={styles.lastSyncText}>
            Last synced: {new Date(item.lastSyncedAt).toLocaleString()}
          </Text>
        )}
        <Text style={styles.tapHintText}>Tap to upload evidence</Text>
      </TouchableOpacity>
    );
  };

  const renderEvidenceItem = ({ item }: { item: Evidence }) => {
    const statusColor = getSyncStatusColor(item.syncStatus);
    const statusLabel = getSyncStatusLabel(item.syncStatus);

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemType}>📎 Evidence</Text>
            <Text style={styles.itemTitle}>{item.fileName}</Text>
            <Text style={styles.itemDescription}>Type: {item.type}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        {item.syncError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {item.syncError}</Text>
          </View>
        )}
        {item.lastSyncedAt && (
          <Text style={styles.lastSyncText}>
            Last synced: {new Date(item.lastSyncedAt).toLocaleString()}
          </Text>
        )}
        <Text style={styles.tapHintText}>Tap to add more evidence</Text>
      </TouchableOpacity>
    );
  };

  const getDisplayData = () => {
    if (!syncData) return [];

    if (selectedTab === 'tasks') {
      return syncData.tasks;
    } else if (selectedTab === 'evidence') {
      return syncData.evidence;
    } else {
      // Combine both with type markers
      return [
        ...syncData.tasks.map(t => ({ ...t, _type: 'task' })),
        ...syncData.evidence.map(e => ({ ...e, _type: 'evidence' })),
      ];
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item._type === 'evidence' || 'fileName' in item) {
      return renderEvidenceItem({ item });
    }
    return renderTaskItem({ item });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Loading sync status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sync Status</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Connection Status */}
      <View
        style={[
          styles.connectionBanner,
          syncData?.isOnline ? styles.onlineBanner : styles.offlineBanner,
        ]}
      >
        <Text
          style={[
            styles.connectionText,
            syncData?.isOnline ? styles.onlineText : styles.offlineText,
          ]}
        >
          {syncData?.isOnline ? '🟢 Online' : '🔴 Offline'}
        </Text>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{syncData?.totalItems || 0}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={[styles.statNumber, styles.pendingNumber]}>
            {syncData?.pendingItems || 0}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, styles.syncedCard]}>
          <Text style={[styles.statNumber, styles.syncedNumber]}>
            {syncData?.syncedItems || 0}
          </Text>
          <Text style={styles.statLabel}>Synced</Text>
        </View>
        <View style={[styles.statCard, styles.failedCard]}>
          <Text style={[styles.statNumber, styles.failedNumber]}>
            {syncData?.failedItems || 0}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {/* Sync Button */}
      <TouchableOpacity
        style={[
          styles.syncButton,
          (!syncData?.isOnline || isSyncing) && styles.syncButtonDisabled,
        ]}
        onPress={handleManualSync}
        disabled={!syncData?.isOnline || isSyncing}
      >
        {isSyncing ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.syncButtonText}> Syncing...</Text>
          </>
        ) : (
          <Text style={styles.syncButtonText}>🔄 Sync Now</Text>
        )}
      </TouchableOpacity>

      {/* Last Sync Info */}
      {syncData?.lastSyncAt && (
        <Text style={styles.lastSyncInfo}>
          Last sync: {new Date(syncData.lastSyncAt).toLocaleString()}
        </Text>
      )}

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'all' && styles.activeTabText,
            ]}
          >
            All (
            {(syncData?.tasks.length || 0) + (syncData?.evidence.length || 0)})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'tasks' && styles.activeTab]}
          onPress={() => setSelectedTab('tasks')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'tasks' && styles.activeTabText,
            ]}
          >
            Tasks ({syncData?.tasks.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'evidence' && styles.activeTab]}
          onPress={() => setSelectedTab('evidence')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'evidence' && styles.activeTabText,
            ]}
          >
            Evidence ({syncData?.evidence.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={getDisplayData()}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadSyncData}
            colors={['#8B0000']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items to sync</Text>
          </View>
        }
      />

      {/* File Upload Modal */}
      <FileUploadModal
        visible={showUploadModal}
        onClose={handleCloseModal}
        onFileSelect={handleFileSelect}
        title="Upload Evidence"
        description={
          selectedItem
            ? 'projectId' in selectedItem
              ? `Task: ${selectedItem.title}`
              : `Evidence: ${selectedItem.fileName}`
            : undefined
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8B0000',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 60,
  },
  connectionBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  onlineBanner: {
    backgroundColor: '#D4EDDA',
  },
  offlineBanner: {
    backgroundColor: '#F8D7DA',
  },
  connectionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  onlineText: {
    color: '#155724',
  },
  offlineText: {
    color: '#721C24',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  pendingCard: {
    borderColor: '#FFC107',
    backgroundColor: '#FFF9E6',
  },
  syncedCard: {
    borderColor: '#28A745',
    backgroundColor: '#E8F5E9',
  },
  failedCard: {
    borderColor: '#DC3545',
    backgroundColor: '#FFEBEE',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  pendingNumber: {
    color: '#F57C00',
  },
  syncedNumber: {
    color: '#2E7D32',
  },
  failedNumber: {
    color: '#C62828',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: '#8B0000',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastSyncInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  activeTab: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  tabText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemType: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
  },
  lastSyncText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6C757D',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
  },
  tapHintText: {
    marginTop: 8,
    fontSize: 11,
    color: '#8B0000',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default SyncStatusScreen;
