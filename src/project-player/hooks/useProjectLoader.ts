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
import { createOrUpdateProgramUserMapping, updateEntityDetails } from '../../../src/services/participantService';
import { getProjectCategoryList} from '../../../src/services/projectService';
import { useAuth } from '@contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@contexts/LanguageContext';
import { STATUS } from '@constants/app.constant';

export const useProjectLoader = (
  config: ProjectPlayerConfig,
  data: ProjectPlayerData,
) => {
  const {user} = useAuth();
  const { t } = useLanguage();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // setIsLoading(true);

        // config.mode = "edit" and data contains  projectId.
        if (config.mode === 'edit' || config.mode === 'read-only') {
          const { entityId, province, projectId } = data;

          try {
            let projectData;
            if (projectId) {
              const res = await getProjectDetails(projectId);
              projectData = res.data;
            } else {
              try {
                projectData = await createProjectForEntity(entityId, province);
                const thisDate = new Date().toISOString();
                if (projectData?._id) {
                  await updateEntityDetails({
                    userId: `${user?.id}`,
                    entityId: entityId,
                    entityUpdates: {
                      onBoardedProjectId: projectData._id,
                      onBoardingProjectCreatedAt: thisDate
                    },
                  });
                  
                  const participantId = projectData.entityInformation?.externalId;
                  if (!participantId) {
                     throw new Error('Created project is missing entityInformation.externalId');
                  }
                 // create user program Mapping for the participant
                  await createOrUpdateProgramUserMapping({
                    userId: participantId,
                    programId: process.env.GLOBAL_LC_PROGRAM_ID,
                    metaInformation: {
                      onBoardedProjectId: projectData?._id,
                      onBoardingProjectCreatedAt: thisDate
                    },
                    status: STATUS.NOT_ONBOARDED
                  });
                  

                  const ref = await AsyncStorage.getItem('my_program_user_ref');
                  if (ref) {
                    await updateProjectInfo(projectData._id, ref);
                  }
                }
              } catch (error) {
                console.log(error as Error)
              }             
            }
            if (!projectData) {
              throw new Error(t('projectPlayer.failToLoad'));
            }
            setProjectData(projectData);
          } catch (err) {
            console.error('Failed to load project templates:', err);
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
  }, [config.mode, data.projectId, data.solutionId, data.data, data,error, user?.id]);

  return { projectData, isLoading, error };
};
