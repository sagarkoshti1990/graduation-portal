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
import dataService, { isNetworkOffline } from '../../../src/services/dataService';
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
  const [oldProjectData, setOldProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // config.mode = "edit" and data contains  projectId.
        if (config.mode === 'edit' || config.mode === 'read-only') {
          const { entityId, province, projectId } = data;
          let projectData;
          // When caller provides pre-loaded project data (e.g. offline download), use it directly
          if (data.data) {
            setProjectData(data.data);
            return;
          }
          if (projectId) {
            if (entityId) {
              // Offline-first: always check dataService — it reads cache when offline or
              // when there are pending unsynced edits (Rules 1, 2, 3).
              const result = await dataService.getProject<ProjectData>(entityId, projectId);

              if (result.isOffline && !result.offlineDataAvailable) {
                // Offline AND no cached project — user needs to download first
                throw new Error(t('offlineSync.dataUnavailable'));
              }

              projectData = result.data as ProjectData;

              // If we served from cache while online (pending sync edits exist), kick off
              // a background refresh so the UI eventually shows the server's latest state —
              // but only after we have rendered with the local edits.
              if (projectData && result.fromCache && !result.isOffline) {
                dataService.getProject<ProjectData>(entityId, projectId).then(fresh => {
                  if (fresh.data && !fresh.fromCache) setProjectData(fresh.data);
                }).catch(() => {});
              }
            } else {
              // No entityId available — fall back to scanning offline participant storage
              // (getProjectDetails already does this when isNetworkOffline() is true)
              const res = await getProjectDetails(projectId);
              if (!res.data && isNetworkOffline()) {
                throw new Error(t('offlineSync.dataUnavailable'));
              }
              projectData = res.data;
            }
          } else {
            if (isNetworkOffline()) {
              throw new Error(t('offlineSync.dataUnavailable'));
            }
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
          }
          if (!projectData) {
            throw new Error(t('projectPlayer.failToLoad'));
          }
          setProjectData(projectData);
        } else if (config.mode === 'preview' && data?.categoryIds) {
          const templatesData = await getProjectCategoryList();
          const selectedPathway = data?.selectedPathway;
          const pathwayData = templatesData?.find(
            (template: any) => template._id === selectedPathway,
          );
          const categoryIdsString = data?.categoryIds.join(',');
          const taskResponse = await getTaskDetails(categoryIdsString);
          const taskResult = taskResponse.data;
          const children:any = [];
          const categoryExternalIds:any = []
          if(data?.oldProjectId) {
            const oldData = await getProjectDetails(data?.oldProjectId);
            if(oldData?.data) {
              setOldProjectData(oldData.data)
            }
            // const resultCat = 
            for(let key in taskResult) {
              const cat = taskResult[key][0]?.categories?.find((item:any) => item._id === key);
              if(cat?.externalId) {
                categoryExternalIds.push(cat.externalId);
              }
            }
          }
          pathwayData?.children?.forEach((child: any) => {
            let taskEntry = taskResult?.[child._id];
            let newChildId = child._id;
            if (!taskEntry) {
              const relation = data?.pillarCategoryRelation?.find(
                (rel: any) => rel.pillarId === child._id,
              );

              newChildId = relation?.selectedCategoryId;
              if (newChildId) {
                taskEntry = taskResult?.[newChildId];
              }
            }

            // 3️⃣ Normalize tasks safely
            const tasks = Array.isArray(taskEntry)
              ? taskEntry?.[0]?.tasks ?? []
              : taskEntry?.tasks ?? [];

            const templateId = taskEntry?.[0]?._id
            categoryExternalIds.push(child.externalId);
            children.push( {
              ...child,
              tasks,
              templateId,
              categoryId: newChildId,
            });
          })
          const updatedPathwayData = {
            ...pathwayData,
            categoryExternalIds,
            children: children.filter((e:any) => e?.tasks?.length > 0),
          };

          setProjectData(updatedPathwayData);
        } else if (data.solutionId) {
          setProjectData(null);
        }
      } catch (err) {
        console.error('Failed to load project templates:', err);
        setProjectData(null);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [config.mode,t, data.projectId, data.solutionId, data.data, data,error, user?.id]);

  return { projectData,oldProjectData, isLoading, error };
};
