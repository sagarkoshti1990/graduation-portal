# Web URL Routing Guide

## Overview

The MyApp web application now supports URL-based routing, allowing users to navigate directly to specific screens using browser URLs. This is implemented using React Navigation's deep linking feature.

## Available Routes

### 1. **Home / Project List**

- **URL:** `http://localhost:3000/`
- **Description:** Shows the main project list screen
- **Component:** `ProjectListScreen`

### 2. **Project Detail**

- **URL:** `http://localhost:3000/project/:id`
- **Example:** `http://localhost:3000/project/123`
- **Description:** Shows details for a specific project
- **Component:** `ProjectDetailScreen`
- **Parameters:**
  - `id` - The project ID to display

### 3. **File Upload Example**

- **URL:** `http://localhost:3000/upload`
- **Description:** Shows the file upload example/demo screen
- **Component:** `FileUploadExample`

### 4. **Sync Status**

- **URL:** `http://localhost:3000/sync`
- **Description:** Shows the synchronization status screen
- **Component:** `SyncStatusScreen`

### 5. **Web Component Demo**

- **URL:** `http://localhost:3000/demo`
- **Description:** Shows the web component demo screen
- **Component:** `WebComponentScreen`

## How It Works

### Implementation Details

The URL routing is configured in `src/navigation/AppNavigator.tsx` using the `linking` prop of `NavigationContainer`:

```typescript
const linking = {
  prefixes: ['http://localhost:3000', 'https://yourapp.com'],
  config: {
    screens: {
      ProjectList: '',
      ProjectDetail: 'project/:id',
      UploadExample: 'upload',
      SyncStatus: 'sync',
      WebComponentDemo: 'demo',
    },
  },
};
```

### Browser Navigation

Users can:

1. **Type URLs directly** in the browser address bar
2. **Bookmark pages** for quick access
3. **Use browser back/forward buttons** for navigation
4. **Share specific URLs** with others

### Programmatic Navigation

In your code, you can navigate using:

```typescript
// Navigate to project detail
navigation.navigate('ProjectDetail', { id: '123' });

// Navigate to upload screen
navigation.navigate('UploadExample');

// Navigate to sync status
navigation.navigate('SyncStatus');
```

## URL Parameters

### Dynamic Route Parameters

For routes with parameters (like ProjectDetail), you can access them in your component:

```typescript
import { useRoute } from '@react-navigation/native';

const ProjectDetailScreen = () => {
  const route = useRoute();
  const { id } = route.params;

  // Use the id parameter
  console.log('Project ID:', id);
};
```

### Query Parameters

You can also pass query parameters in the URL:

```
http://localhost:3000/project/123?view=details&tab=files
```

Access them with:

```typescript
const route = useRoute();
const { id } = route.params;
// Query params would be in route.params as well if configured
```

## Testing URL Routing

### Development Mode

1. Start the development server:

   ```bash
   npm run web
   ```

2. Open your browser to `http://localhost:3000`

3. Test different URLs:
   - `http://localhost:3000/` - Home
   - `http://localhost:3000/project/1` - Project 1
   - `http://localhost:3000/upload` - Upload screen
   - `http://localhost:3000/sync` - Sync status
   - `http://localhost:3000/demo` - Demo screen

### Console Logging

The app logs the current URL in the browser console for debugging:

```
Current URL: http://localhost:3000/upload
Pathname: /upload
```

## Browser History

The webpack configuration includes `historyApiFallback: true`, which ensures:

- Clean URLs without hash fragments (no `#/project/123`)
- Browser back/forward buttons work correctly
- Page refresh maintains the current route
- Direct URL access works properly

## Production Deployment

When deploying to production:

1. Update the `prefixes` in the linking configuration:

   ```typescript
   prefixes: ['https://yourapp.com', 'https://www.yourapp.com'];
   ```

2. Ensure your web server is configured to redirect all requests to `index.html` (like `historyApiFallback`)

3. Configure your server (nginx example):
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

## Adding New Routes

To add a new route:

1. **Add the screen to the Stack.Navigator:**

   ```typescript
   <Stack.Screen
     name="NewScreen"
     component={NewScreenComponent}
     options={{ title: 'New Screen' }}
   />
   ```

2. **Add the route to the linking config:**

   ```typescript
   const linking = {
     config: {
       screens: {
         // ... existing routes
         NewScreen: 'new-screen',
       },
     },
   };
   ```

3. **Access at:** `http://localhost:3000/new-screen`

## Common Issues

### Issue: URL changes but screen doesn't update

**Solution:** Make sure the screen name in the linking config matches the Stack.Screen name exactly.

### Issue: Page refresh shows 404

**Solution:** Ensure webpack devServer has `historyApiFallback: true` (already configured).

### Issue: Parameters not received

**Solution:** Check the route parameter syntax in the linking config (e.g., `project/:id`).

## Benefits

1. ✅ **Bookmarkable URLs** - Users can bookmark specific screens
2. ✅ **Direct Access** - Share specific pages with others
3. ✅ **Browser Navigation** - Back/forward buttons work
4. ✅ **SEO Friendly** - Better for search engine indexing
5. ✅ **User Experience** - Matches standard web app behavior
6. ✅ **Deep Linking** - Works on both web and mobile platforms

## Related Files

- **Navigation Config:** `src/navigation/AppNavigator.tsx`
- **Webpack Config:** `webpack.config.js`
- **Web Entry Point:** `index.web.js`

## Further Reading

- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [React Navigation Configuring Links](https://reactnavigation.org/docs/configuring-links/)
