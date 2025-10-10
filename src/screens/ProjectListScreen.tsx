import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Project, Task, Evidence } from '../types';
import { StorageService } from '../services/StorageService';
import { NetworkService } from '../services/NetworkService';
import { SyncService } from '../services/SyncService';
import ProjectCard from '../components/ProjectCard';
import Layout from '../components/layout/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { createRTLStyle } from '../utils/rtlUtils';
import Alert from '../components/ui/alert';
interface ProjectListScreenProps {
  navigation: any;
}

const ProjectListScreen: React.FC<ProjectListScreenProps> = ({
  navigation,
}) => {
  const { t, isRTL } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const filters = [
    { key: 'all', label: t('projectList.filters.all'), count: 0 },
    {
      key: 'not-enrolled',
      label: t('projectList.filters.notEnrolled'),
      count: 0,
    },
    { key: 'enrolled', label: t('projectList.filters.enrolled'), count: 0 },
    {
      key: 'in-progress',
      label: t('projectList.filters.inProgress'),
      count: 0,
    },
    { key: 'completed', label: t('projectList.filters.completed'), count: 0 },
  ];

  const createSampleProjects = (): Project[] => {
    return [
      {
        id: '1',
        name: 'Digital Marketing Fundamentals',
        description:
          'Learn the basics of digital marketing including SEO, social media, and content marketing.',
        status: 'not-enrolled',
        progress: 0,
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Project Management Certification',
        description:
          'Complete certification in project management methodologies and best practices.',
        status: 'enrolled',
        progress: 25,
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Data Analysis with Python',
        description:
          'Master data analysis techniques using Python and popular libraries.',
        status: 'in-progress',
        progress: 60,
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: 'Leadership Development Program',
        description:
          'Develop leadership skills through practical exercises and case studies.',
        status: 'completed',
        progress: 100,
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  };

  const generateSampleSyncData = async () => {
    // Generate sample tasks and evidence for testing
    const sampleTasks: Task[] = [
      {
        id: 'task-demo-1',
        projectId: '1',
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the project',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: true,
        syncStatus: 'pending',
      },
      {
        id: 'task-demo-2',
        projectId: '2',
        title: 'Submit final report',
        description: 'Prepare and submit the final project report',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: false,
        syncStatus: 'synced',
        lastSyncedAt: new Date(Date.now() - 3600000),
      },
      {
        id: 'task-demo-3',
        projectId: '3',
        title: 'Review code changes',
        description: 'Review and approve pending code changes',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        needsSync: true,
        syncStatus: 'failed',
        syncError: 'Network timeout',
      },
    ];

    const sampleEvidence: Evidence[] = [
      {
        id: 'evidence-demo-1',
        taskId: 'task-demo-1',
        type: 'photo',
        fileName: 'project-screenshot.jpg',
        filePath: '/storage/photos/screenshot.jpg',
        uploadedAt: new Date(),
        needsSync: true,
        syncStatus: 'pending',
      },
      {
        id: 'evidence-demo-2',
        taskId: 'task-demo-2',
        type: 'document',
        fileName: 'final-report.pdf',
        filePath: '/storage/documents/report.pdf',
        uploadedAt: new Date(),
        needsSync: false,
        syncStatus: 'synced',
        lastSyncedAt: new Date(Date.now() - 7200000),
      },
    ];

    await StorageService.saveTasks(sampleTasks);
    for (const evidence of sampleEvidence) {
      await StorageService.addEvidence(evidence);
    }
    console.log('Sample sync data generated!');
  };

  const checkAsyncStorage = useCallback(async () => {
    try {
      // Check async storage for pending sync items
      const syncData = await SyncService.getSyncStatusData();
      setPendingSyncCount(syncData.pendingItems);
      // Generate sample data if none exists
      if (syncData.totalItems === 0) {
        console.log('No sync data found, generating sample data...');
        await generateSampleSyncData();
        // Recheck after generating
        const updatedSyncData = await SyncService.getSyncStatusData();
        setPendingSyncCount(updatedSyncData.pendingItems);
      }
    } catch (error) {
      console.error('Error checking async storage:', error);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      let loadedProjects = await StorageService.getProjects();

      // If no projects exist, create some sample data
      if (loadedProjects.length === 0) {
        loadedProjects = createSampleProjects();
        await StorageService.saveProjects(loadedProjects);
      }

      setProjects(loadedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert(t('common.error'), t('projectList.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const setupNetworkListener = useCallback(() => {
    NetworkService.subscribeToNetworkChanges(status => {
      setIsConnected(status.isConnected);
      if (status.isConnected) {
        // Check async storage when connection is restored
        checkAsyncStorage();
      }
    });
  }, [checkAsyncStorage]);

  const filterProjects = useCallback(() => {
    let filtered = projects;

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(project => project.status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        project =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, activeFilter]);

  useEffect(() => {
    loadProjects();
    setupNetworkListener();
    checkAsyncStorage(); // Check storage on mount
  }, [loadProjects, setupNetworkListener, checkAsyncStorage]);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  // Check storage when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkAsyncStorage();
    });
    return unsubscribe;
  }, [navigation, checkAsyncStorage]);

  const handleProjectPress = (project: Project) => {
    navigation.navigate('ProjectDetail', { project });
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <ProjectCard project={item} onPress={handleProjectPress} />
  );

  const renderFilterButton = (filter: any) => {
    const isActive = activeFilter === filter.key;
    const count =
      filter.key === 'all'
        ? projects.length
        : projects.filter(p => p.status === filter.key).length;

    return (
      <TouchableOpacity
        key={filter.key}
        style={[styles.filterButton, isActive && styles.activeFilterButton]}
        onPress={() => setActiveFilter(filter.key)}
      >
        <Text
          style={[
            styles.filterButtonText,
            isActive && styles.activeFilterButtonText,
          ]}
        >
          {filter.label}
        </Text>
        <View
          style={[styles.filterBadge, isActive && styles.activeFilterBadge]}
        >
          <Text
            style={[
              styles.filterBadgeText,
              isActive && styles.activeFilterBadgeText,
            ]}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text
            style={[styles.loadingText, createRTLStyle(styles.loadingText)]}
          >
            {t('projectList.loadingProjects')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Layout
        title="Maria Rodriguez"
        statusBarStyle="dark-content"
        statusBarBackgroundColor="#FFFFFF"
        navigation={navigation}
        pendingSyncCount={pendingSyncCount}
      >
        {/* <View style={styles.navigationTabs}>
          <TouchableOpacity style={styles.activeTab}>
            <Text style={styles.activeTabText}>My Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>Dashboard</Text>
          </TouchableOpacity>
        </View> */}
        {/* Main Content */}
        <View style={styles.content}>
          <Text style={[styles.title, createRTLStyle(styles.title)]}>
            {t('projectList.title')}
          </Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, createRTLStyle(styles.searchInput)]}
              placeholder={t('projectList.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6C757D"
              textAlign={isRTL ? 'right' : 'left'}
            />
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            {filters.map(renderFilterButton)}
          </View>

          {/* Connection Status */}
          {!isConnected && (
            <View
              style={[
                styles.offlineIndicator,
                createRTLStyle(styles.offlineIndicator),
              ]}
            >
              <Text
                style={[styles.offlineText, createRTLStyle(styles.offlineText)]}
              >
                {t('projectList.offlineMessage')}
              </Text>
            </View>
          )}

          {/* Projects List */}
          <FlatList
            data={filteredProjects}
            renderItem={renderProjectCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </Layout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadDemoButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  uploadDemoButtonText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButtonText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
  },
  syncBadge: {
    backgroundColor: '#DC3545',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 18,
    alignItems: 'center',
  },
  syncBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  languageSelector: {
    fontSize: 14,
    color: '#6C757D',
    marginRight: 16,
  },
  profileIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#6C757D',
    borderRadius: 12,
  },
  navigationTabs: {
    flexDirection: 'row',
  },
  activeTab: {
    paddingBottom: 8,
    borderBottomWidth: 3,
    borderBottomColor: '#8B0000', // Maroon
    marginRight: 24,
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  inactiveTab: {
    paddingBottom: 8,
  },
  inactiveTabText: {
    fontSize: 16,
    color: '#6C757D',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  activeFilterButton: {
    backgroundColor: '#8B0000', // Maroon
    borderColor: '#8B0000',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6C757D',
    marginRight: 6,
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#6C757D',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterBadge: {
    backgroundColor: '#FFFFFF',
  },
  filterBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  activeFilterBadgeText: {
    color: '#8B0000',
  },
  offlineIndicator: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  offlineText: {
    color: '#856404',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 16,
  },
});

export default ProjectListScreen;
