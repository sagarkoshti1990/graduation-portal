import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Project, Task, Evidence } from '../types';
import { StorageService } from '../services/StorageService';
import { NetworkService } from '../services/NetworkService';
import { UploadedFile } from '../services/FileUploadService';
import FileUploadModal from '../components/FileUploadModal';

interface ProjectDetailScreenProps {
  navigation: any;
  route: any;
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onAddEvidence: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onAddEvidence,
}) => {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            task.status === 'completed' && styles.checkedBox,
          ]}
          onPress={() => onToggleComplete(task.id)}
        >
          {task.status === 'completed' && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              task.status === 'completed' && styles.completedTaskTitle,
            ]}
          >
            {task.title}
          </Text>
          <Text style={styles.taskDescription}>{task.description}</Text>
          {task.dueDate && (
            <Text style={styles.dueDate}>
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.evidenceButton}
          onPress={() => onAddEvidence(task.id)}
        >
          <Text style={styles.evidenceButtonText}>
            📎 Evidence ({task.evidence?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { project: initialProject } = route.params;
  const [project, setProject] = useState<Project>(initialProject);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
  });
  const [isConnected, setIsConnected] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    setupNetworkListener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupNetworkListener = useCallback(() => {
    NetworkService.subscribeToNetworkChanges(status => {
      setIsConnected(status.isConnected);
    });
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const projectTasks = await StorageService.getTasks(project.id);
      setTasks(projectTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [project.id]);

  const handleToggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await StorageService.updateTask(taskId, {
        status: newStatus,
        isOffline: !isConnected,
        needsSync: !isConnected,
      });

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );

      // Update project progress
      const completedTasks = tasks.filter(t =>
        t.id === taskId ? newStatus === 'completed' : t.status === 'completed',
      ).length;
      const totalTasks = tasks.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setProject(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const task: Task = {
        id: Date.now().toString(),
        projectId: project.id,
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
        status: 'pending',
        evidence: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isOffline: !isConnected,
        needsSync: !isConnected,
      };

      await StorageService.addTask(task);
      setTasks(prevTasks => [...prevTasks, task]);
      setShowAddTaskModal(false);
      setNewTask({ title: '', description: '', dueDate: '' });

      if (!isConnected) {
        Alert.alert('Offline', 'Task saved locally and will sync when online');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleAddEvidence = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setShowUploadModal(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setShowUploadModal(false);
    setSelectedTaskId(null);
  }, []);

  const handleFileSelect = useCallback(
    async (file: UploadedFile) => {
      if (!selectedTaskId) return;

      try {
        const evidence: Evidence = {
          id: `evidence-${Date.now()}`,
          taskId: selectedTaskId,
          type: file.type.startsWith('image/') ? 'photo' : 'document',
          fileName: file.name,
          filePath: file.uri,
          uploadedAt: new Date(),
          isOffline: !isConnected,
          needsSync: !isConnected,
          syncStatus: 'pending',
        };

        await StorageService.addEvidence(evidence);

        // Update task evidence count
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === selectedTaskId
              ? { ...t, evidence: [...(t.evidence || []), evidence] }
              : t,
          ),
        );

        // Reload tasks to get updated evidence count
        await loadTasks();

        console.log('Evidence added successfully:', evidence);
      } catch (error) {
        console.error('Error adding evidence:', error);
        Alert.alert('Error', 'Failed to add evidence');
      }
    },
    [selectedTaskId, isConnected, loadTasks],
  );

  const renderTask = ({ item }: { item: Task }) => (
    <TaskItem
      task={item}
      onToggleComplete={handleToggleComplete}
      onAddEvidence={handleAddEvidence}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{project.name}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Project Info */}
      <View style={styles.projectInfo}>
        <Text style={styles.projectDescription}>{project.description}</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${project.progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{project.progress}%</Text>
        </View>
      </View>

      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            Offline Mode - Changes will sync when connected
          </Text>
        </View>
      )}

      {/* Tasks Section */}
      <View style={styles.tasksSection}>
        <View style={styles.tasksHeader}>
          <Text style={styles.tasksTitle}>Tasks ({tasks.length})</Text>
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => setShowAddTaskModal(true)}
          >
            <Text style={styles.addTaskButtonText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tasksList}
        />
      </View>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddTaskModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TouchableOpacity onPress={handleAddTask}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Task Title *</Text>
            <TextInput
              style={styles.textInput}
              value={newTask.title}
              onChangeText={text =>
                setNewTask(prev => ({ ...prev, title: text }))
              }
              placeholder="Enter task title"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newTask.description}
              onChangeText={text =>
                setNewTask(prev => ({ ...prev, description: text }))
              }
              placeholder="Enter task description"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Due Date</Text>
            <TextInput
              style={styles.textInput}
              value={newTask.dueDate}
              onChangeText={text =>
                setNewTask(prev => ({ ...prev, dueDate: text }))
              }
              placeholder="YYYY-MM-DD"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* File Upload Modal */}
      <FileUploadModal
        visible={showUploadModal}
        onClose={handleCloseUploadModal}
        onFileSelect={handleFileSelect}
        title="Upload Evidence"
        description={
          selectedTaskId
            ? `Add evidence for: ${
                tasks.find(t => t.id === selectedTaskId)?.title || 'Task'
              }`
            : undefined
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8B0000', // Maroon
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
  },
  projectInfo: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  projectDescription: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC', // Light blue
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6F42C1', // Purple
    fontWeight: '500',
    textAlign: 'right',
  },
  offlineIndicator: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  offlineText: {
    color: '#856404',
    fontSize: 14,
  },
  tasksSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  addTaskButton: {
    backgroundColor: '#8B0000', // Maroon
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tasksList: {
    paddingBottom: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#6C757D',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#28A745',
    borderColor: '#28A745',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#6C757D',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#8B0000', // Maroon
    fontWeight: '500',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  evidenceButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  evidenceButtonText: {
    fontSize: 12,
    color: '#6C757D',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6C757D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  saveButton: {
    fontSize: 16,
    color: '#8B0000', // Maroon
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default ProjectDetailScreen;
