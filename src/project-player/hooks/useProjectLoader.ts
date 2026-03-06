import { useState, useEffect } from 'react';
import { ProjectData } from '../types/project.types';
import {
  ProjectPlayerConfig,
  ProjectPlayerData,
} from '../types/components.types';
import {
  createProjectForEntity,
  getProjectDetails,
  getTaskDetails,
  updateProjectInfo
} from '../services/projectPlayerService';
import { updateEntityDetails } from '../../../src/services/participantService';
import { getProjectCategoryList} from '../../../src/services/projectService';
import { useAuth } from '@contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@utils/logger';

export const useProjectLoader = (
  config: ProjectPlayerConfig,
  data: ProjectPlayerData,
) => {
  const {user} = useAuth();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // setIsLoading(true);

        // config.mode = "edit" and data contains  projectId.
        if (config.mode === 'edit') {
          const { entityId, province, projectId } = data;

          try {
            let projectData;
            if (projectId) {
              const res = await getProjectDetails(projectId);
              projectData = res.data;
            } else {
              try {
              const createdProject = await createProjectForEntity(entityId, province || '');

              if (createdProject && typeof createdProject === 'object' && '_id' in createdProject && createdProject._id) {
                await updateEntityDetails({
                  userId: `${user?.id}`,
                  entityId:entityId,
                 entityUpdates:{
                   onBoardedProjectId: createdProject._id,
                 }
                });
                const ref = await AsyncStorage.getItem('my_program_user_ref');
                if (ref && createdProject._id) {
                  await updateProjectInfo(createdProject._id, ref);
                }
              }
              projectData = createdProject;
              } catch (err) {
                logger.error('Failed to create project for entity:', err);
                // Re-throw the error to be handled by the outer catch block
                throw err;
              }
             
            }

            setProjectData(projectData);
          } catch (err) {
            logger.error('Failed to load project templates:', err);
            setProjectData(null);
            setError(err as Error);
          }
        } else if (config.mode === 'preview' && data?.categoryIds) {
          const templatesData = await getProjectCategoryList();
          const selectedPathway = data?.selectedPathway;
          const pathwayData = templatesData?.find(
            (template: any) => template._id === selectedPathway,
          );
          const categoryIdsString = data?.categoryIds.join(',');
          const taskResponse = await getTaskDetails(categoryIdsString);
          const taskResult = taskResponse.data;

          const updatedPathwayData = {
            ...pathwayData,
            children: pathwayData?.children?.map((child: any) => {
              let taskEntry = taskResult?.[child._id];

              if (!taskEntry) {
                const relation = data?.pillarCategoryRelation?.find(
                  (rel: any) => rel.pillarId === child._id,
                );

                const newChildId = relation?.selectedCategoryId;
                if (newChildId) {
                  taskEntry = taskResult?.[newChildId];
                }
              }

              // 3️⃣ Normalize tasks safely
              const tasks = Array.isArray(taskEntry)
                ? taskEntry?.[0]?.tasks ?? []
                : taskEntry?.tasks ?? [];

                const templateId = taskEntry?.[0]?._id

              return {
                ...child,
                tasks,
                templateId
              };
            }),
          };

          setProjectData(updatedPathwayData);
        } else if (data.solutionId) {
          setProjectData(null);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [config.mode, data, error, user?.id]);

  return { projectData, isLoading, error };
};
