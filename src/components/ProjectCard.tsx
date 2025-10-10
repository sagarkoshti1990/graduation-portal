import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-enrolled':
        return '#8B0000'; // Maroon
      case 'enrolled':
        return '#0066CC'; // Blue
      case 'in-progress':
        return '#FF6B35'; // Orange
      case 'completed':
        return '#28A745'; // Green
      default:
        return '#6C757D'; // Gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not-enrolled':
        return 'Not Enrolled';
      case 'enrolled':
        return 'Enrolled';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderTopColor: getStatusColor(project.status) }]}
      onPress={() => onPress(project)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.projectName}>{project.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(project.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(project.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{project.description}</Text>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${project.progress}%`,
                  backgroundColor: '#0066CC', // Light blue
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{project.progress}%</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.taskCount}>{project.tasks.length} tasks</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 4,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
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
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6F42C1', // Purple
    fontWeight: '500',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCount: {
    fontSize: 14,
    color: '#6C757D',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#8B0000', // Maroon
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    padding: 4,
  },
  moreButtonText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: 'bold',
  },
});

export default ProjectCard;

