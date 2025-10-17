# ResponsiveCardList Component

A powerful, feature-rich responsive card list component for React Native that works seamlessly on both native and web platforms.

## Features

✅ **Responsive Grid Layout** - Automatically adjusts columns based on screen size (xs, sm, md, lg, xl)  
✅ **Search Functionality** - Real-time search across all fields  
✅ **Filter Support** - Filter data by multiple criteria  
✅ **Sort Capability** - Sort by any field in ascending or descending order  
✅ **Offline Storage** - Automatic caching with offline mode support  
✅ **Offline Save** - Save individual cards to offline storage  
✅ **Customizable Fields** - Flexible field mapping with support for custom components  
✅ **TypeScript Support** - Full type safety with TypeScript  
✅ **Pull to Refresh** - Native pull-to-refresh support  
✅ **Modular Architecture** - Split into reusable sub-components

## Installation

The component is already included in your project. No additional installation required.

## Quick Start

### Option 1: Using itemKeyMap (Full Control)

```typescript
import ResponsiveCardList from '../components/responsive-card-list';

const MyComponent = () => {
  const data = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      isActive: true,
    },
    // ... more items
  ];

  const itemKeyMap = [
    { key: 'name', label: 'Name', type: 'string', sortable: true },
    { key: 'email', label: 'Email', type: 'string', sortable: true },
    { key: 'role', label: 'Role', type: 'string', sortable: true },
    { key: 'isActive', label: 'Active', type: 'boolean', sortable: true },
  ];

  return (
    <ResponsiveCardList
      data={data}
      itemKeyMap={itemKeyMap}
      storage_key_name="my_list_data"
      card_title="User List"
    />
  );
};
```

### Option 2: Auto-Detect Fields

```typescript
const MyComponent = () => {
  const data = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    // ... more items
  ];

  return (
    <ResponsiveCardList
      data={data}
      storage_key_name="my_list_data"
      card_title="User List"
    />
  );
};
```

## Props

### Main Props

| Prop                | Type         | Required | Default          | Description                                |
| ------------------- | ------------ | -------- | ---------------- | ------------------------------------------ |
| `data`              | `any[]`      | ✅ Yes   | -                | Array of data objects to display           |
| `itemKeyMap`        | `ItemKeyMap` | No       | -                | Field mapping configuration (full control) |
| `storage_key_name`  | `string`     | ✅ Yes   | -                | Storage key for offline data               |
| `card_title`        | `string`     | No       | `"List of User"` | Title displayed in header                  |
| `showDownload`      | `boolean`    | No       | `true`           | Show "Save Offline" button on cards        |
| `enableOfflineMode` | `boolean`    | No       | `true`           | Enable offline storage                     |
| `enableSearch`      | `boolean`    | No       | `true`           | Enable search functionality                |
| `enableFilter`      | `boolean`    | No       | `true`           | Enable filter functionality                |
| `enableSort`        | `boolean`    | No       | `true`           | Enable sort functionality                  |

**Note:** You can use one of two approaches:

- `itemKeyMap` - Full control with custom labels, types, and rendering
- Neither - Auto-detect all fields from the first data item

### Item Key Map Configuration

```typescript
interface ItemKeyMapConfig {
  key: string; // Field key in data object
  label: string; // Display label
  type: FieldType; // Field type
  component?: (item: any) => ReactNode; // Custom component
  render?: (value: any, item: any) => ReactNode; // Custom render
  sortable?: boolean; // Enable sorting
  filterable?: boolean; // Enable filtering
  hidden?: boolean; // Hide field
}

type FieldType = 'string' | 'number' | 'boolean' | 'component' | 'date';
```

### Grid Configuration

```typescript
columnsConfig?: {
  xs?: number;  // Extra small screens (< 576px) - default: 1
  sm?: number;  // Small screens (576-767px) - default: 2
  md?: number;  // Medium screens (768-991px) - default: 2
  lg?: number;  // Large screens (992-1199px) - default: 3
  xl?: number;  // Extra large screens (>= 1200px) - default: 4
}
```

### Callbacks

```typescript
onItemClick?: (item: any) => void;      // Called when card is clicked
onDownload?: (item: any) => void;       // Called when download button is clicked
onRefresh?: () => Promise<void>;        // Called on pull-to-refresh
```

## Usage Examples

### Basic Usage

```typescript
<ResponsiveCardList
  data={users}
  itemKeyMap={userKeyMap}
  storage_key_name="users_cache"
  card_title="User Directory"
/>
```

### With Custom Components

```typescript
const itemKeyMap = [
  { key: 'name', label: 'Name', type: 'string' },
  {
    key: 'avatar',
    label: 'Avatar',
    type: 'component',
    component: item => (
      <Image
        source={{ uri: item.avatarUrl }}
        style={{ width: 50, height: 50, borderRadius: 25 }}
      />
    ),
  },
  {
    key: 'status',
    label: 'Status',
    type: 'string',
    render: value => (
      <View
        style={{
          backgroundColor: value === 'active' ? 'green' : 'red',
          padding: 4,
          borderRadius: 4,
        }}
      >
        <Text style={{ color: 'white' }}>{value}</Text>
      </View>
    ),
  },
];
```

### With Callbacks

```typescript
<ResponsiveCardList
  data={products}
  itemKeyMap={productKeyMap}
  storage_key_name="products_cache"
  card_title="Product Catalog"
  onItemClick={item => {
    navigation.navigate('ProductDetails', { id: item.id });
  }}
  onDownload={item => {
    console.log('Saving offline:', item);
    // Custom save logic
  }}
  onRefresh={async () => {
    await fetchProducts();
  }}
/>
```

### Custom Grid Layout

```typescript
<ResponsiveCardList
  data={items}
  itemKeyMap={itemKeyMap}
  storage_key_name="items_cache"
  columnsConfig={{
    xs: 1, // 1 column on phones
    sm: 2, // 2 columns on small tablets
    md: 3, // 3 columns on tablets
    lg: 4, // 4 columns on laptops
    xl: 6, // 6 columns on large screens
  }}
/>
```

## Offline Mode

The component automatically saves data to local storage when online and loads it when offline.

### How it works:

1. **When Online**: Data is automatically saved to AsyncStorage
2. **When Offline**: Data is loaded from AsyncStorage
3. **Offline Indicator**: Shows when displaying cached data
4. **Auto-Sync**: Automatically switches between online and offline modes

### Storage Key

The `storage_key_name` prop determines where data is stored. Use unique keys for different lists:

```typescript
// Users list
<ResponsiveCardList storage_key_name="users_list" ... />

// Products list
<ResponsiveCardList storage_key_name="products_list" ... />
```

## Download Functionality

Each card includes a download button that allows users to save individual items.

### Download Formats:

- **JSON**: Structured data format (default)
- **CSV**: Spreadsheet format

### Platform Support:

- **Web**: Direct file download
- **Native**: Console logging (can be extended with react-native-fs)

## Searching, Filtering, and Sorting

### Search

Search across all non-component fields automatically:

```typescript
// User types "john" in search box
// Searches: name, email, role, etc.
```

### Filter

Active filters are displayed as chips that can be removed:

```typescript
// Filter by role
filters = { role: 'Admin' };

// Multiple filters
filters = { role: 'Admin', status: 'active' };
```

### Sort

Sort by any sortable field in ascending or descending order:

```typescript
// Click sort dropdown
// Select field to sort by
// Click again to toggle asc/desc
```

## Component Architecture

```
ResponsiveCardList/
├── ResponsiveCardList.tsx      # Main component
├── types.ts                     # TypeScript types
├── hooks/
│   ├── useCardData.ts          # Data management
│   ├── useOfflineStorage.ts    # Storage operations
│   └── useResponsiveColumns.ts # Responsive layout
├── components/
│   ├── CardListHeader.tsx      # Header with controls
│   ├── CardGrid.tsx            # Grid container
│   ├── CardItem.tsx            # Individual card
│   ├── CardItemField.tsx       # Field renderer
│   ├── DownloadButton.tsx      # Download button
│   ├── SearchBar.tsx           # Search input
│   ├── SortDropdown.tsx        # Sort dropdown
│   ├── FilterBar.tsx           # Active filters
│   └── OfflineIndicator.tsx    # Offline status
└── utils/
    ├── storage.ts              # Storage helpers
    ├── filtering.ts            # Filter logic
    ├── sorting.ts              # Sort logic
    └── download.ts             # Download logic
```

## Advanced Usage

### Using Individual Components

```typescript
import {
  CardItem,
  SearchBar,
  useCardData,
  useResponsiveColumns,
} from '../components/responsive-card-list';

// Build custom layouts using sub-components
```

### Custom Validation

Extend the storage service with custom validation:

```typescript
import { createCardListStorage } from '../components/responsive-card-list/utils/storage';

class CustomStorage extends createCardListStorage('my_key') {
  protected async validate(item: any) {
    if (!item.email) {
      return { success: false, error: 'Email required' };
    }
    return { success: true };
  }
}
```

## Integration with Common Storage Service

The component uses the new `CommonStorageService` for data persistence:

```typescript
import { CommonStorageService } from '../../services/CommonStorageService';

// The component automatically creates a storage instance
// based on storage_key_name prop
```

## Example in GluestackUIExample

See the **Responsive** tab in GluestackUIExample for a complete working example:

```typescript
// Navigate to: src/examples/GluestackUIExample.tsx
// Select the "Responsive" tab
```

## Troubleshooting

### Issue: Cards not displaying

**Solution**: Check that `data` is an array. You can optionally provide `itemKeyMap` for field configuration, or let the component auto-detect fields.

### Issue: Offline mode not working

**Solution**: Ensure `@react-native-community/netinfo` and `@react-native-async-storage/async-storage` are installed and linked.

### Issue: Save Offline not working on mobile

**Solution**: The default implementation logs to console. For file downloads, integrate `react-native-fs` or `expo-file-system`.

### Issue: Search not finding results

**Solution**: Ensure fields in `itemKeyMap` have `type` set and are not `'component'`.

## Best Practices

1. **Use unique storage keys** for different lists
2. **Keep itemKeyMap simple** - only include fields you want to display
3. **Use custom components** for complex rendering
4. **Implement onRefresh** for better UX
5. **Test offline mode** to ensure proper caching

## Performance Tips

1. **Limit initial data** - Use pagination for large datasets
2. **Memoize callbacks** - Use `useCallback` for event handlers
3. **Optimize images** - Compress images before displaying
4. **Lazy load components** - Load custom components on demand

## License

MIT

---

**Built with ❤️ for MyApp**
