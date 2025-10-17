# Common Storage Service

A generic, reusable CRUD storage service for React Native applications using AsyncStorage.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Support for PUT (full replacement) and PATCH (partial update)
- ✅ Filtering, sorting, and pagination
- ✅ Bulk operations
- ✅ Automatic ID generation
- ✅ Timestamp management
- ✅ Type-safe with TypeScript
- ✅ Extensible with hooks and validation
- ✅ Easy to inherit and customize

## Quick Start

### 1. Using CommonStorageService directly

```typescript
import { CommonStorageService } from './services/CommonStorageService';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create instance
const todoStorage = new CommonStorageService<Todo>({ key_name: 'todos' });

// Or use factory
const todoStorage = CommonStorageService.create<Todo>('todos');
```

### 2. Creating a custom service by inheritance

```typescript
import { CommonStorageService } from './services/CommonStorageService';
import { StorageConfig } from './services/storage/types';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

class ProductStorageService extends CommonStorageService<Product> {
  constructor() {
    const config: StorageConfig<Product> = {
      key_name: 'products',
      idField: 'id',
      timestampFields: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    };
    super(config);
  }

  // Add custom validation
  protected async validate(
    item: Product,
  ): Promise<{ success: boolean; error?: string }> {
    if (!item.name) {
      return { success: false, error: 'Name is required' };
    }
    if (item.price < 0) {
      return { success: false, error: 'Price must be positive' };
    }
    return { success: true };
  }

  // Add custom methods
  async getInStockProducts(): Promise<Product[]> {
    return this.getAll({ where: { inStock: true } });
  }

  async updatePrice(id: string, price: number): Promise<void> {
    await this.patch(id, { price });
  }
}

// Export singleton
export const productStorage = new ProductStorageService();
```

## API Reference

### CRUD Operations

#### Create

```typescript
// Create single item
const result = await storage.create({
  title: 'New Todo',
  completed: false,
});

// Create multiple items
const bulkResult = await storage.createBulk([
  { title: 'Todo 1', completed: false },
  { title: 'Todo 2', completed: false },
]);
```

#### Read

```typescript
// Get all items
const all = await storage.getAll();

// Get with filters
const filtered = await storage.getAll({
  where: { completed: true },
  orderBy: 'createdAt',
  order: 'desc',
  limit: 10,
});

// Get by ID
const item = await storage.getById('123');

// Get by custom field
const item = await storage.getByField('title', 'My Todo');

// Get paginated
const page = await storage.getPaginated(1, 10, {
  orderBy: 'createdAt',
  order: 'desc',
});

// Count items
const count = await storage.count();
const filteredCount = await storage.count({ where: { completed: true } });
```

#### Update

```typescript
// PATCH - partial update
await storage.patch('123', { completed: true });

// PUT - full replacement
await storage.put('123', {
  id: '123',
  title: 'Updated Todo',
  completed: true,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-02',
});

// Generic update (defaults to PATCH)
await storage.update('123', { completed: true }, 'PATCH');
```

#### Delete

```typescript
// Delete single item
await storage.delete('123');

// Delete multiple items
await storage.deleteBulk(['123', '456', '789']);

// Delete by criteria
await storage.deleteWhere({ completed: true });
await storage.deleteWhere(
  item => item.completed && item.createdAt < '2023-01-01',
);

// Clear all
await storage.clear();
```

### Advanced Filtering

```typescript
// Filter with function
const items = await storage.getAll({
  where: item => item.price > 100 && item.inStock,
  orderBy: 'price',
  order: 'desc',
});

// Filter with object
const items = await storage.getAll({
  where: { category: 'electronics', inStock: true },
});
```

### Hooks (Override in subclass)

```typescript
class MyStorage extends CommonStorageService<MyType> {
  // Validate before save
  protected async validate(
    item: MyType,
  ): Promise<{ success: boolean; error?: string }> {
    if (!item.name) {
      return { success: false, error: 'Name required' };
    }
    return { success: true };
  }

  // Called after create
  protected async afterCreate(item: MyType): Promise<void> {
    console.log('Item created:', item);
    // Send analytics, trigger events, etc.
  }

  // Called after update
  protected async afterUpdate(item: MyType): Promise<void> {
    console.log('Item updated:', item);
  }

  // Called after delete
  protected async afterDelete(item: MyType): Promise<void> {
    console.log('Item deleted:', item);
  }
}
```

## Configuration Options

```typescript
interface StorageConfig<T> {
  key_name: string; // Storage key (required)
  idField?: keyof T; // ID field name (default: 'id')
  timestampFields?: {
    createdAt?: keyof T; // Created timestamp field
    updatedAt?: keyof T; // Updated timestamp field
  };
  schema?: SchemaDefinition<T>; // Optional schema for validation
}
```

## Examples

See the `examples/` directory for complete implementations:

- `ProjectStorageService.ts` - Project management
- `UserStorageService.ts` - User management

## Usage in Components

```typescript
import { productStorage } from './services/storage/examples/ProductStorageService';

function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await productStorage.getInStockProducts();
    setProducts(data);
  };

  const addProduct = async () => {
    const result = await productStorage.create({
      name: 'New Product',
      price: 99.99,
      inStock: true,
    });

    if (result.success) {
      console.log('Product added:', result.data);
      loadProducts();
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    // Your component JSX
  );
}
```

## Best Practices

1. **Use inheritance for entity-specific logic**

   - Create a service class for each entity type
   - Add custom validation and business logic
   - Export singleton instances

2. **Add validation in the validate hook**

   - Validate required fields
   - Check for duplicates
   - Enforce business rules

3. **Use hooks for side effects**

   - afterCreate: Send analytics, notifications
   - afterUpdate: Sync with server, update cache
   - afterDelete: Clean up related data

4. **Use bulk operations for performance**

   - Use `createBulk` for multiple inserts
   - Use `deleteBulk` for multiple deletions

5. **Handle errors gracefully**
   - Check result.success before using result.data
   - Display user-friendly error messages

## Migration from Old Storage Service

```typescript
// Old way
const projects = await StorageService.getProjects();
await StorageService.saveProjects(updatedProjects);

// New way
const projects = await projectStorage.getAll();
await projectStorage.update(projectId, updates);
```

## License

MIT
