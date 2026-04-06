import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Pressable,
  Divider,
  Badge,
  Modal,
  Checkbox,
  ScrollView,
  ButtonText,
} from '@gluestack-ui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@config/i18n';
// import { FileUploadService } from 'src/services/FileUploadService';

// ---------- Types ----------
type FileMeta = {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
};
type Task = {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  files?: FileMeta[];
};
type Project = {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
};
type ProjectData = {
  id: string; // ✅ Required unique project ID
  type: 'bundle' | 'single';
  title: string;
  description?: string;
  meta?: Record<string, any>;
  projects?: Project[];
  tasks?: Task[];
  synced?: boolean;
};

type Props = {
  projectdata: ProjectData | string;
  previewmode?: string;
};

// ---------- Utils ----------
const uid = (p = '') => p + Math.random().toString(36).slice(2, 9) + Date.now();
const DB_NAME = 'projectPlayerDB_v4';
const STORE_PROJECTS = 'projects';
const STORE_FILES = 'files';

// ---------- IndexedDB Helpers ----------
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS))
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_FILES))
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store: string, value: any) {
  const db = await openIDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(store: string, key: string) {
  const db = await openIDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------- Mobile Helpers ----------
async function mobileSaveFileBase64(
  id: string,
  meta: FileMeta & { base64: string; projectId: string },
) {
  await AsyncStorage.setItem(
    `projectPlayer_file_${meta.projectId}_${id}`,
    JSON.stringify(meta),
  );
}
async function mobileGetFileBase64(projectId: string, id: string) {
  const raw = await AsyncStorage.getItem(
    `projectPlayer_file_${projectId}_${id}`,
  );
  return raw ? JSON.parse(raw) : null;
}

// ---------- Component ----------
const ProjectPlayer: React.FC<Props> = props => {
  const { projectdata, previewmode = false } = props;
  const previewMode = previewmode === 'true';
  const data =
    typeof projectdata === 'string'
      ? JSON.parse(projectdata)
      : typeof projectdata === 'object'
      ? projectdata
      : {};
  // 🔒 Require unique project ID

  const [project, setProject] = useState<ProjectData>(data);
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    taskId?: string;
    projectId?: string;
  }>({ open: false });
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);

  // ---------- Load Project Data on Mount ----------
  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
          const saved = await idbGet(STORE_PROJECTS, data.id);
          if (saved) setProject(saved);
          else await idbPut(STORE_PROJECTS, data);
        } else {
          const raw = await AsyncStorage.getItem(`projectPlayer_${data.id}`);
          if (raw) setProject(JSON.parse(raw));
          else
            await AsyncStorage.setItem(
              `projectPlayer_${data.id}`,
              JSON.stringify(data),
            );
        }
      } catch (e) {
        console.warn('Offline load failed', e);
      }
    })();
  }, [data]);

  // ---------- Persist Offline ----------
  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
          await idbPut(STORE_PROJECTS, project);
        } else {
          await AsyncStorage.setItem(
            `projectPlayer_${project.id}`,
            JSON.stringify(project),
          );
        }
      } catch (e) {
        console.warn('Offline save failed', e);
      }
    })();
  }, [project]);

  // ---------- Handle File Upload ----------
  const handleUploadGallery = useCallback(async () => {
    return new Promise<void>(resolve => {
      // Create file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true; // Allow multiple file selection
      input.accept = '*/*'; // Accept all file types (can be changed to 'image/*' for images only)

      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;

        if (!files || files.length === 0) {
          resolve();
          return;
        }

        const { taskId, projectId } = uploadModal;
        const uploadedFiles: FileMeta[] = [];

        // Process each selected file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileId = uid('file_');

          const meta: FileMeta = {
            id: fileId,
            name: file.name,
            mime: file.type,
            size: file.size,
            createdAt: Date.now(),
          };

          try {
            if (typeof window !== 'undefined' && 'indexedDB' in window) {
              // Save file blob to IndexedDB
              await idbPut(STORE_FILES, {
                ...meta,
                projectId: project.id,
                data: file, // Store the File object directly (it's already a Blob)
              });
              uploadedFiles.push(meta);
            } else {
              // Mobile: Convert to base64 and save to AsyncStorage
              const reader = new FileReader();
              await new Promise<void>(resolveReader => {
                reader.onload = async () => {
                  const base64 = reader.result as string;
                  await mobileSaveFileBase64(fileId, {
                    ...meta,
                    base64,
                    projectId: project.id,
                  });
                  uploadedFiles.push(meta);
                  resolveReader();
                };
                reader.onerror = () => {
                  console.warn('File read failed for:', file.name);
                  resolveReader();
                };
                reader.readAsDataURL(file);
              });
            }
          } catch (err) {
            console.warn('file save failed for:', file.name, err);
          }
        }

        // Update project state with all uploaded files
        if (uploadedFiles.length > 0) {
          setProject(prev => {
            const updateTasks = (tasks: Task[]) =>
              tasks.map(t =>
                t.id === taskId
                  ? {
                      ...t,
                      files: [...(t.files || []), ...uploadedFiles],
                    }
                  : t,
              );
            if (prev.type === 'single')
              return { ...prev, tasks: updateTasks(prev.tasks || []) };
            if (prev.type === 'bundle' && projectId) {
              const projects = prev.projects?.map(p =>
                p.id === projectId ? { ...p, tasks: updateTasks(p.tasks) } : p,
              );
              return { ...prev, projects };
            }
            return prev;
          });
        }

        setUploadModal({ open: false });
        resolve();
      };

      input.oncancel = () => {
        resolve();
      };

      // Trigger file picker
      input.click();
    });
  }, [project.id, uploadModal]);

  // ---------- File Preview ----------
  const previewFileById = async (fileId: string) => {
    if (!project.id) return alert(i18n.t('webComponentProjectPlayer.missingProjectId'));
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const rec = await idbGet(STORE_FILES, fileId);
        if (!rec || rec.projectId !== project.id)
          return alert(i18n.t('webComponentProjectPlayer.fileNotFoundForProject'));
        const url = URL.createObjectURL(rec.data);
        setPreviewFile({ name: rec.name, url });
      } else {
        const rec = await mobileGetFileBase64(project.id, fileId);
        if (!rec) return alert(i18n.t('webComponentProjectPlayer.fileNotFoundOffline'));
        setPreviewFile({ name: rec.name, url: rec.base64 });
      }
    } catch {
      alert(i18n.t('webComponentProjectPlayer.previewFailed'));
    }
  };

  // ---------- Sync (Mock) ----------
  const handleSync = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 1500)); // simulate API delay
    setProject(prev => ({ ...prev, synced: true }));
    setSyncing(false);
  };

  if (!data || !data.id) {
    return (
      <Box p="$4" alignItems="center" justifyContent="center">
        <Text color="$red600" fontWeight="bold">
          {i18n.t('webComponentProjectPlayer.uniqueProjectIdRequired')}
        </Text>
      </Box>
    );
  }

  // ---------- Render Task ----------
  const renderTask = (task: Task, projectId?: string) => (
    <Box
      key={task.id}
      borderWidth={1}
      borderColor={task.status === 'completed' ? '$green400' : '$muted200'}
      backgroundColor={task.status === 'completed' ? '$green50' : '$white'}
      rounded="$lg"
      p="$3"
      mt="$2"
    >
      <HStack justifyContent="space-between" alignItems="center">
        <HStack alignItems="center" space="sm" flex={1}>
          {/* ✅ Completion Checkbox */}
          <Checkbox
            value={task.id}
            checked={task.status === 'completed'}
            onChange={() =>
              !previewMode &&
              setProject(prev => {
                const toggle = (tasks: Task[]) =>
                  tasks.map(t =>
                    t.id === task.id
                      ? {
                          ...t,
                          status:
                            t.status === 'completed' ? 'pending' : 'completed',
                        }
                      : t,
                  );
                if (prev.type === 'single')
                  return { ...prev, tasks: toggle(prev.tasks || []) };
                if (prev.type === 'bundle' && projectId) {
                  const projects = prev.projects?.map(p =>
                    p.id === projectId ? { ...p, tasks: toggle(p.tasks) } : p,
                  );
                  return { ...prev, projects };
                }
                return prev;
              })
            }
          />

          {/* 📋 Task Info */}
          <VStack flex={1}>
            <HStack alignItems="center" space="sm">
              <Text
                fontWeight="bold"
                textDecorationLine={
                  task.status === 'completed' ? 'line-through' : 'none'
                }
              >
                {task.title}
              </Text>
              {task.status === 'completed' && (
                <Badge bgColor="$green600" size="$sm">
                  <Text>Done</Text>
                </Badge>
              )}
            </HStack>

            <Text
              fontSize="$sm"
              color={task.status === 'completed' ? '$muted400' : '$muted600'}
            >
              {task.description}
            </Text>

            {/* 🗂️ Attached Files */}
            {task.files?.length ? (
              <VStack mt="$2" space="xs">
                {task.files.map(f => (
                  <Pressable key={f.id} onPress={() => previewFileById(f.id)}>
                    <Text color="$blue600" fontSize="$sm" underline>
                      {f.name}
                    </Text>
                  </Pressable>
                ))}
              </VStack>
            ) : null}
          </VStack>
        </HStack>

        {/* 🔘 Action Buttons */}
        {!previewMode &&
          (task.type === 'file' ? (
            <Button
              size="sm"
              onPress={() =>
                setUploadModal({ open: true, taskId: task.id, projectId })
              }
            >
              <ButtonText>Upload</ButtonText>
            </Button>
          ) : (
            <Button
              size="sm"
              variant={task.status === 'completed' ? 'solid' : 'outline'}
              onPress={() =>
                setProject(prev => {
                  const toggle = (tasks: Task[]) =>
                    tasks.map(t =>
                      t.id === task.id
                        ? {
                            ...t,
                            status:
                              t.status === 'completed'
                                ? 'pending'
                                : 'completed',
                          }
                        : t,
                    );
                  if (prev.type === 'single')
                    return { ...prev, tasks: toggle(prev.tasks || []) };
                  if (prev.type === 'bundle' && projectId) {
                    const projects = prev.projects?.map(p =>
                      p.id === projectId ? { ...p, tasks: toggle(p.tasks) } : p,
                    );
                    return { ...prev, projects };
                  }
                  return prev;
                })
              }
            >
              <ButtonText>
                {task.status === 'completed'
                  ? 'Mark Incomplete'
                  : 'Mark Complete'}
              </ButtonText>
            </Button>
          ))}
      </HStack>
    </Box>
  );

  // ---------- Render ----------
  return (
    <ScrollView>
      <VStack p="$4" space="lg">
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Text fontWeight="bold" fontSize="$lg">
              {project.title}
            </Text>
            <Text color="$muted600">{project.description}</Text>
            {project.synced && <Badge mt="$1">Synced</Badge>}
          </VStack>
          <Button
            size="sm"
            variant="outline"
            onPress={handleSync}
            isDisabled={syncing}
          >
            <ButtonText>{syncing ? 'Syncing...' : 'Sync'}</ButtonText>
          </Button>
        </HStack>
        <Divider />

        {project.type === 'bundle' ? (
          <VStack space="lg">
            {project.projects?.map(proj => (
              <Box
                key={proj.id}
                borderWidth={1}
                borderColor="$muted200"
                rounded="$xl"
                p="$3"
              >
                <Text fontWeight="bold" fontSize="$md">
                  {proj.title}
                </Text>
                <Text color="$muted600" mb="$2">
                  {proj.description}
                </Text>
                <Divider />
                {proj.tasks?.map(t => renderTask(t, proj.id))}
              </Box>
            ))}
          </VStack>
        ) : (
          <VStack>{project.tasks?.map(t => renderTask(t))}</VStack>
        )}
      </VStack>

      {/* Upload & Preview Modal */}
      <Modal
        isOpen={uploadModal.open || !!previewFile}
        onClose={() => {
          if (uploadModal.open) setUploadModal({ open: false });
          if (previewFile) setPreviewFile(null);
        }}
      >
        <Modal.Content maxWidth="90%" maxHeight="80%">
          <Modal.CloseButton />
          {/* Modal Header */}
          <Modal.Header>
            <Text>
              {uploadModal.open
                ? 'Upload File'
                : previewFile?.name || 'Preview'}
            </Text>
          </Modal.Header>
          {/* Modal Body */}
          <Modal.Body>
            {uploadModal.open ? (
              <>
                <VStack space="md" alignItems="center">
                  <Button
                    onPress={handleUploadGallery}
                    size="lg"
                    variant="solid"
                    accessibilityLabel="Select files from gallery"
                  >
                    <ButtonText>📁 Select Files</ButtonText>
                  </Button>
                  <Text fontSize="$sm" color="$muted600" textAlign="center">
                    Select one or multiple files to upload
                  </Text>
                  <Text
                    mt="$2"
                    fontSize="$xs"
                    color="$muted500"
                    textAlign="center"
                  >
                    Files will be saved offline for project: {project.id}
                  </Text>
                </VStack>
              </>
            ) : previewFile?.url ? (
              previewFile.url.includes('pdf') ? (
                <iframe
                  title="pdf"
                  src={previewFile.url}
                  style={{ width: '100%', height: 400 }}
                />
              ) : (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  style={{ maxWidth: '100%', maxHeight: 400 }}
                />
              )
            ) : null}
          </Modal.Body>
          {/* Modal Footer */}
          <Modal.Footer>
            {uploadModal.open && (
              <Button onPress={() => setUploadModal({ open: false })}>
                <ButtonText>Close</ButtonText>
              </Button>
            )}
            {!!previewFile && (
              <Button onPress={() => setPreviewFile(null)}>
                <ButtonText>Close</ButtonText>
              </Button>
            )}
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default ProjectPlayer;
