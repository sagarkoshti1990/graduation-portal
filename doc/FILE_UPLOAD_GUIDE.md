# File Upload System - Implementation Guide

This guide explains how to use the new file upload system with Base64 storage, progress tracking, and size validation.

## Overview

The file upload system consists of three main components:

1. **FileStorageService** - Handles Base64 file storage (IndexedDB for web, AsyncStorage for mobile)
2. **FileUploadService** - Handles file selection, camera access, and Base64 conversion
3. **FileUploadModal** - UI component for file uploads with progress tracking

## Features

- ✅ Base64 file storage
- ✅ Progress tracking (0-100%)
- ✅ MAX_FILE_SIZE validation with user-friendly messages
- ✅ Platform-specific storage (IndexedDB for web, AsyncStorage for mobile)
- ✅ Multiple upload methods: Camera, Gallery, Document Picker
- ✅ Flexible API with backward compatibility

## Storage Locations

### Web

- **Database**: `uploads` (IndexedDB)
- **Store**: `files`
- Files are stored with Base64 data and metadata

### Mobile

- **Storage**: AsyncStorage
- **Keys**: `file_storage_{fileId}`
- Files are stored with Base64 data and metadata

## Usage Examples

### Example 1: Basic Usage (Legacy - Backward Compatible)

```typescript
import FileUploadModal from '../components/FileUploadModal';
import { UploadedFile } from '../services/FileUploadService';

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);

  const handleFileSelect = async (file: UploadedFile) => {
    console.log('File selected:', file);
    // File contains: id, name, uri, type, size, uploadedAt, base64Data
  };

  return (
    <FileUploadModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      onFileSelect={handleFileSelect}
      title="Upload File"
      description="Select a file to upload"
    />
  );
};
```

### Example 2: Using File Function Prop (No Storage)

When you provide the `file` prop, the file will NOT be stored automatically. It will be passed directly to your function.

```typescript
import FileUploadModal from '../components/FileUploadModal';
import { UploadedFile } from '../services/FileUploadService';

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);

  const handleFile = async (fileData: UploadedFile) => {
    console.log('File received:', fileData);
    // Process the file directly without storing
    // fileData contains: id, name, uri, type, size, uploadedAt, base64Data

    // You can upload to server, display preview, etc.
    await uploadToServer(fileData.base64Data);
  };

  return (
    <FileUploadModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      file={handleFile}
      title="Upload to Server"
      description="File will be uploaded directly"
      maxFileSize={10 * 1024 * 1024} // 10MB
    />
  );
};
```

### Example 3: Using fileId Prop (Store and Return ID)

When you provide the `fileId` prop, the file will be saved to storage, and the generated key will be used.

```typescript
import FileUploadModal from '../components/FileUploadModal';

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);

  const handleFileStored = async (fileData: { fileId: string }) => {
    console.log('File stored with ID:', fileData.fileId);

    // Save the fileId to your database
    await saveEvidenceRecord({
      evidenceId: generateId(),
      fileId: fileData.fileId, // Use this to retrieve file later
      taskId: currentTaskId,
    });
  };

  return (
    <FileUploadModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      fileId="evidence_file" // Indicates file should be stored
      title="Upload Evidence"
      description="File will be saved to storage"
      maxFileSize={15 * 1024 * 1024} // 15MB
    />
  );
};
```

### Example 4: Using Both file and fileId Props (Store and Process)

When you provide both `file` and `fileId` props, the file will be stored AND the generated fileId will be passed to your function.

```typescript
import FileUploadModal from '../components/FileUploadModal';

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);

  const handleFileStoredAndProcessed = async (fileData: { fileId: string }) => {
    console.log('File stored with ID:', fileData.fileId);

    // File is already stored in IndexedDB/AsyncStorage
    // Now save the reference in your evidence record
    const evidence = {
      id: generateEvidenceId(),
      taskId: currentTask.id,
      fileStorageId: fileData.fileId, // Reference to stored file
      uploadedAt: new Date(),
      syncStatus: 'pending',
    };

    await StorageService.addEvidence(evidence);
  };

  return (
    <FileUploadModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      file={handleFileStoredAndProcessed}
      fileId="task_evidence" // Store + pass ID to function
      title="Upload Evidence"
      description="Evidence will be saved and recorded"
      maxFileSize={20 * 1024 * 1024} // 20MB
    />
  );
};
```

### Example 5: Retrieving Stored Files

```typescript
import { FileStorageService } from '../services/FileStorageService';

// Retrieve a specific file
const retrieveFile = async (fileId: string) => {
  const file = await FileStorageService.getFile(fileId);

  if (file) {
    console.log('File:', file.name);
    console.log('Size:', FileStorageService.formatFileSize(file.size));
    console.log('Type:', file.type);

    // Display image
    if (file.type.startsWith('image/')) {
      return <img src={file.base64Data} alt={file.name} />;
    }
  }
};

// Get all files metadata (without base64 data)
const listFiles = async () => {
  const metadata = await FileStorageService.getAllFilesMetadata();
  console.log('Total files:', metadata.length);

  metadata.forEach(file => {
    console.log(
      `${file.name} - ${FileStorageService.formatFileSize(file.size)}`,
    );
  });
};

// Get total storage used
const getStorageInfo = async () => {
  const totalSize = await FileStorageService.getStorageSize();
  console.log('Total storage:', FileStorageService.formatFileSize(totalSize));
};

// Delete a file
const deleteFile = async (fileId: string) => {
  const success = await FileStorageService.deleteFile(fileId);
  console.log('Deleted:', success);
};

// Clear all files
const clearAllFiles = async () => {
  const success = await FileStorageService.clearAllFiles();
  console.log('All files cleared:', success);
};
```

## Progress Tracking

The FileUploadModal automatically displays progress during file upload:

- Shows percentage (0-100%)
- Displays progress bar
- Shows status messages like "Capturing photo...", "Loading image...", etc.

Progress is tracked during:

- File reading (FileReader)
- Base64 conversion
- Storage operations

## File Size Validation

The system includes built-in MAX_FILE_SIZE validation:

```typescript
// Default limits (can be overridden with maxFileSize prop)
const DEFAULT_LIMITS = {
  camera: 10 * 1024 * 1024, // 10MB
  gallery: 15 * 1024 * 1024, // 15MB
  document: 20 * 1024 * 1024, // 20MB
};

// Custom limit
<FileUploadModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  file={handleFile}
  maxFileSize={5 * 1024 * 1024} // 5MB limit
  title="Upload Small File"
/>;
```

If a file exceeds the limit, a user-friendly error message is displayed:

```
"File size (15.2 MB) exceeds the maximum allowed size of 10 MB. Please select a smaller file."
```

## FileStorageService API

### Save File

```typescript
const result = await FileStorageService.saveFile(
  base64Data, // Base64 string
  fileName, // File name
  fileType, // MIME type
  fileSize, // Size in bytes
  metadata, // Optional metadata object
);

if (result.success) {
  console.log('File ID:', result.fileId);
}
```

### Get File

```typescript
const file = await FileStorageService.getFile(fileId);
// Returns: { id, name, type, size, base64Data, uploadedAt, metadata }
```

### Delete File

```typescript
const success = await FileStorageService.deleteFile(fileId);
```

### Get All Files Metadata

```typescript
const metadata = await FileStorageService.getAllFilesMetadata();
// Returns array without base64Data for performance
```

### Get Storage Size

```typescript
const bytes = await FileStorageService.getStorageSize();
const formatted = FileStorageService.formatFileSize(bytes);
```

### Clear All Files

```typescript
const success = await FileStorageService.clearAllFiles();
```

## FileUploadService API

### Open Camera

```typescript
const file = await FileUploadService.openCamera({
  maxSize: 10 * 1024 * 1024,
  quality: 0.8,
  includeBase64: true,
  onProgress: progress => {
    console.log(`Progress: ${progress}%`);
  },
});
```

### Open Image Library

```typescript
const file = await FileUploadService.openImageLibrary({
  maxSize: 15 * 1024 * 1024,
  quality: 0.9,
  includeBase64: true,
  onProgress: progress => {
    console.log(`Progress: ${progress}%`);
  },
});
```

### Open Document Picker

```typescript
const file = await FileUploadService.openDocumentPicker(undefined, {
  maxSize: 20 * 1024 * 1024,
  includeBase64: true,
  onProgress: progress => {
    console.log(`Progress: ${progress}%`);
  },
});
```

### Validate File Size

```typescript
const validation = FileUploadService.validateFileSize(fileSize, maxSize);
if (!validation.valid) {
  Alert.alert('File Too Large', validation.message);
}
```

## Best Practices

1. **Choose the Right Approach**:

   - Use `onFileSelect` for backward compatibility
   - Use `file` prop when you want to process files without storing
   - Use `fileId` prop when you want to store files and get the ID
   - Use both `file` and `fileId` when you need storage + custom processing

2. **Set Appropriate Size Limits**:

   - Images: 10-15 MB
   - Documents: 15-20 MB
   - Videos: Consider external storage or chunked uploads

3. **Handle Errors Gracefully**:

   - Check for null returns from upload functions
   - Validate file types if needed
   - Show user-friendly error messages

4. **Clean Up Old Files**:

   - Periodically delete unused files
   - Implement file expiration logic
   - Monitor storage usage

5. **Consider Performance**:
   - Use `getAllFilesMetadata()` instead of `getAllFiles()` for listings
   - Implement pagination for large file lists
   - Consider compression for large images

## Database Schema for Evidence

When using this system with evidence records, your schema might look like:

```typescript
interface Evidence {
  id: string; // Evidence record ID
  taskId: string; // Associated task
  fileStorageId: string; // ID from FileStorageService
  fileName: string; // Original file name
  fileType: string; // MIME type
  fileSize: number; // Size in bytes
  uploadedAt: Date; // Upload timestamp
  syncStatus: 'pending' | 'synced' | 'failed';
  needsSync: boolean;
}
```

## Migration Guide

If you're migrating from the old system:

1. Update all `FileUploadModal` usages to use new props
2. Replace direct file storage with `FileStorageService`
3. Update evidence records to use `fileStorageId`
4. Test file upload and retrieval flows

## Troubleshooting

### Files not showing in IndexedDB

- Check browser console for errors
- Ensure IndexedDB is not disabled
- Verify database name is "uploads"

### Progress not updating

- Ensure `onProgress` callback is provided
- Check that `includeBase64` is true
- Verify FileReader events are firing

### File too large errors

- Check `maxFileSize` prop value
- Adjust limits based on your requirements
- Consider image compression for photos

### Mobile files not storing

- Verify AsyncStorage permissions
- Check Base64 conversion
- Ensure adequate device storage

## Support

For issues or questions, please refer to:

- FileStorageService.ts (mobile)
- FileStorageService.web.ts (web)
- FileUploadService.ts (mobile)
- FileUploadService.web.ts (web)
- FileUploadModal.tsx (UI component)
