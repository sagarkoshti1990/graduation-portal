# IDP / Project / Bundle Task Management POC

A React Native application with web support for managing Individual Development Plans (IDPs), Projects, and Bundles with offline capabilities and automatic synchronization.

## Features

### 1. Project/Bundle Listing

- **Card-based layout** displaying projects with:
  - Project name and description
  - Status badges (Not Enrolled, Enrolled, In Progress, Completed)
  - Progress bars with percentage
  - Task count
  - Action buttons (View Details, More options)

### 2. Project Detail Page

- **Task Management** with:
  - Add new tasks with title, description, and due date
  - Mark tasks as completed/pending
  - Upload evidence (photos, documents, files)
  - Progress tracking

### 3. Offline Functionality

- **Local Storage** using AsyncStorage
- Tasks and evidence stored locally when offline
- **Queue system** for syncing changes when online
- Visual indicators for offline mode

### 4. Sync Mechanism

- **Network detection** using NetInfo
- **Automatic sync** when connection is restored
- **Manual sync** capability
- **Progress indicators** during sync

### 5. User Experience

- **Modern UI** based on provided design images
- **Color-coded status** system
- **Responsive design** for web and mobile
- **Intuitive navigation** between screens

## Design System

### Color Palette

- **Primary**: Maroon (#8B0000) - Main accent color
- **Secondary**: Blue (#0066CC) - Progress and info
- **Success**: Green (#28A745) - Completed status
- **Warning**: Orange (#FF6B35) - In Progress status
- **Neutral**: Gray (#6C757D) - Secondary text

### Layout

- **Card-based design** with subtle shadows
- **Rounded corners** for modern look
- **Consistent spacing** and typography
- **Status badges** with color coding

## Technical Architecture

### Services

- **StorageService**: Handles local data persistence
- **NetworkService**: Manages network connectivity
- **SyncService**: Handles offline-to-online synchronization

### Components

- **ProjectCard**: Individual project display
- **ProjectListScreen**: Main listing view
- **ProjectDetailScreen**: Task management interface

### Data Flow

1. User opens app → Loads projects from local storage
2. User adds/modifies tasks → Stored locally with offline flag
3. Network reconnects → Automatic sync of queued changes
4. Real-time updates → UI reflects current state

## Getting Started

### Prerequisites

- Node.js >= 20
- React Native development environment
- For mobile: Android Studio / Xcode

### Installation

```bash
# Install dependencies
npm install

# For iOS (if running on iOS)
cd ios && pod install && cd ..
```

### Running the App

#### Web Development

```bash
npm run web
```

Open http://localhost:8080 in your browser

#### Mobile Development

```bash
# Android
npm run android

# iOS
npm run ios
```

### Development Scripts

```bash
npm start          # Start Metro bundler
npm run web        # Run web version
npm run android    # Run Android app
npm run ios        # Run iOS app
npm run lint       # Run ESLint
npm test           # Run tests
```

## Offline Testing

### Simulate Offline Mode

1. Open browser developer tools
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Test adding tasks and evidence
5. Switch back to "Online" to see sync

### Mobile Offline Testing

1. Enable airplane mode
2. Add tasks and evidence
3. Disable airplane mode
4. Observe automatic sync

## Sample Data

The app includes sample projects for demonstration:

- Digital Marketing Fundamentals (Not Enrolled)
- Project Management Certification (Enrolled)
- Data Analysis with Python (In Progress)
- Leadership Development Program (Completed)

## Future Enhancements

### Planned Features

- **Real API integration** (currently uses mock services)
- **File upload** with actual file handling
- **Push notifications** for task reminders
- **Advanced filtering** and search
- **Export functionality** for reports
- **Multi-user support** with authentication

### Technical Improvements

- **Database migration** to SQLite for better performance
- **Background sync** for better user experience
- **Conflict resolution** for concurrent edits
- **Data encryption** for sensitive information
- **Performance optimization** for large datasets

## Architecture Decisions

### Why React Native?

- **Cross-platform** development (web, iOS, Android)
- **Shared codebase** reduces development time
- **Native performance** for mobile features
- **Web support** for desktop users

### Why AsyncStorage?

- **Simple API** for key-value storage
- **Cross-platform** compatibility
- **Sufficient** for POC requirements
- **Easy migration** to SQLite later

### Why NetInfo?

- **Reliable** network detection
- **Cross-platform** support
- **Event-driven** updates
- **Standard** React Native library

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **Web not loading**: Check webpack configuration
3. **Storage not persisting**: Verify AsyncStorage permissions
4. **Sync not working**: Check network connectivity

### Debug Mode

Enable debug logging by setting `__DEV__ = true` in the app configuration.

## Contributing

This is a POC (Proof of Concept) for demonstrating offline-first task management capabilities. The codebase is structured for easy extension and modification.

### Code Structure

```
src/
├── components/     # Reusable UI components
├── screens/       # Screen components
├── services/      # Business logic services
├── styles/        # Theme and styling
├── types/         # TypeScript definitions
└── navigation/    # Navigation setup
```

### Adding New Features

1. Define types in `src/types/`
2. Create services in `src/services/`
3. Build components in `src/components/`
4. Add screens in `src/screens/`
5. Update navigation as needed

