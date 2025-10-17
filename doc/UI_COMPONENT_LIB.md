# UI Abstraction Layer Implementation Guide

## 📋 Project Context

- **Technology Stack:** React Native project using TypeScript, targeting Web and Android.
- **Third-Party UI Library:** `@gluestack-ui/themed` (62+ components)
- **Architectural Goal:** Create an internal UI abstraction layer where application components are completely decoupled from the third-party library.

**Core Principle:** ⚠️ **No file outside of the `src/components/ui/` directory should ever import directly from `@gluestack-ui/themed`.**

---

## 🗂️ 1. Directory Structure

```
src/
├── components/
│   └── ui/
│       ├── layout/
│       │   ├── View.tsx
│       │   ├── Box.tsx
│       │   ├── HStack.tsx
│       │   ├── VStack.tsx
│       │   ├── Center.tsx
│       │   ├── Grid.tsx
│       │   ├── Flex.tsx
│       │   ├── Container.tsx
│       │   ├── Divider.tsx
│       │   ├── AspectRatio.tsx
│       │   ├── Spacer.tsx
│       │   ├── Wrap.tsx
│       │   ├── ZStack.tsx
│       │   ├── SimpleGrid.tsx
│       │   └── index.ts
│       │
│       ├── typography/
│       │   ├── Text.tsx
│       │   ├── Heading.tsx
│       │   └── index.ts
│       │
│       ├── forms/
│       │   ├── Button.tsx
│       │   ├── Input.tsx
│       │   ├── Select.tsx
│       │   ├── Checkbox.tsx
│       │   ├── Radio.tsx
│       │   ├── Switch.tsx
│       │   ├── Slider.tsx
│       │   ├── TextArea.tsx
│       │   ├── FormControl.tsx
│       │   ├── NumberInput.tsx
│       │   ├── PinInput.tsx
│       │   ├── Editable.tsx
│       │   └── index.ts
│       │
│       ├── feedback/
│       │   ├── Alert.tsx
│       │   ├── Toast.tsx
│       │   ├── Spinner.tsx
│       │   ├── Progress.tsx
│       │   ├── Skeleton.tsx
│       │   ├── CircularProgress.tsx
│       │   └── index.ts
│       │
│       ├── overlay/
│       │   ├── Modal.tsx
│       │   ├── Popover.tsx
│       │   ├── Tooltip.tsx
│       │   ├── Drawer.tsx
│       │   ├── AlertDialog.tsx
│       │   ├── ActionSheet.tsx
│       │   ├── Menu.tsx
│       │   └── index.ts
│       │
│       ├── media/
│       │   ├── Image.tsx
│       │   ├── Icon.tsx
│       │   ├── Avatar.tsx
│       │   └── index.ts
│       │
│       ├── disclosure/
│       │   ├── Accordion.tsx
│       │   ├── Disclosure.tsx
│       │   └── index.ts
│       │
│       ├── navigation/
│       │   ├── Link.tsx
│       │   ├── Breadcrumb.tsx
│       │   ├── Tabs.tsx
│       │   ├── Steps.tsx
│       │   └── index.ts
│       │
│       ├── data-display/
│       │   ├── Badge.tsx
│       │   ├── Card.tsx
│       │   ├── List.tsx
│       │   ├── Stat.tsx
│       │   ├── Table.tsx
│       │   ├── Tag.tsx
│       │   ├── Kbd.tsx
│       │   ├── Code.tsx
│       │   └── index.ts
│       │
│       ├── utility/
│       │   ├── Pressable.tsx
│       │   ├── Portal.tsx
│       │   ├── Fab.tsx
│       │   ├── CloseButton.tsx
│       │   └── index.ts
│       │
│       ├── types/
│       │   └── index.ts        # Shared TypeScript types
│       │
│       └── index.ts             # Central export barrel file
│
├── screens/
│   └── LoginScreen.tsx          # Example usage screen
│
└── tsconfig.json                # Path aliases configuration
```

---

## 📦 2. Complete Component List (62 Components)

### Layout Components (14)

View, Box, HStack, VStack, Center, Grid, Flex, Container, Divider, AspectRatio, Spacer, Wrap, ZStack, SimpleGrid

### Typography Components (2)

Text, Heading

### Form Components (12)

Button, Input, Select, Checkbox, Radio, Switch, Slider, TextArea, FormControl, NumberInput, PinInput, Editable

### Feedback Components (6)

Alert, Toast, Spinner, Progress, Skeleton, CircularProgress

### Overlay Components (7)

Modal, Popover, Tooltip, Drawer, AlertDialog, ActionSheet, Menu

### Media Components (3)

Image, Icon, Avatar

### Disclosure Components (2)

Accordion, Disclosure

### Navigation Components (4)

Link, Breadcrumb, Tabs, Steps

### Data Display Components (8)

Badge, Card, List, Stat, Table, Tag, Kbd, Code

### Utility Components (4)

Pressable, Portal, Fab, CloseButton

**Reference:** [Gluestack UI All Components](https://gluestack.io/ui/docs/components/all-components)

---

## 🔧 3. Base UI Wrapper Components Implementation

### 3.1 Layout Components

#### `src/components/ui/layout/Box.tsx`

```typescript
import React from 'react';
import { Box as GluestackBox } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type BoxProps = ComponentProps<typeof GluestackBox>;

export const Box: React.FC<BoxProps> = props => {
  return <GluestackBox {...props} />;
};
```

#### `src/components/ui/layout/VStack.tsx`

```typescript
import React from 'react';
import { VStack as GluestackVStack } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type VStackProps = ComponentProps<typeof GluestackVStack>;

export const VStack: React.FC<VStackProps> = props => {
  return <GluestackVStack {...props} />;
};
```

#### `src/components/ui/layout/HStack.tsx`

```typescript
import React from 'react';
import { HStack as GluestackHStack } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type HStackProps = ComponentProps<typeof GluestackHStack>;

export const HStack: React.FC<HStackProps> = props => {
  return <GluestackHStack {...props} />;
};
```

#### `src/components/ui/layout/Center.tsx`

```typescript
import React from 'react';
import { Center as GluestackCenter } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type CenterProps = ComponentProps<typeof GluestackCenter>;

export const Center: React.FC<CenterProps> = props => {
  return <GluestackCenter {...props} />;
};
```

#### `src/components/ui/layout/Grid.tsx`

```typescript
import React from 'react';
import { Grid as GluestackGrid } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type GridProps = ComponentProps<typeof GluestackGrid>;

export const Grid: React.FC<GridProps> = props => {
  return <GluestackGrid {...props} />;
};
```

#### `src/components/ui/layout/Divider.tsx`

```typescript
import React from 'react';
import { Divider as GluestackDivider } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type DividerProps = ComponentProps<typeof GluestackDivider>;

export const Divider: React.FC<DividerProps> = props => {
  return <GluestackDivider {...props} />;
};
```

#### `src/components/ui/layout/index.ts`

```typescript
export { Box } from './Box';
export { VStack } from './VStack';
export { HStack } from './HStack';
export { Center } from './Center';
export { Grid } from './Grid';
export { Divider } from './Divider';
// Add more layout components as needed
```

---

### 3.2 Typography Components

#### `src/components/ui/typography/Text.tsx`

```typescript
import React from 'react';
import { Text as GluestackText } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type TextProps = ComponentProps<typeof GluestackText>;

export const Text: React.FC<TextProps> = props => {
  return <GluestackText {...props} />;
};
```

#### `src/components/ui/typography/Heading.tsx`

```typescript
import React from 'react';
import { Heading as GluestackHeading } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type HeadingProps = ComponentProps<typeof GluestackHeading>;

export const Heading: React.FC<HeadingProps> = props => {
  return <GluestackHeading {...props} />;
};
```

#### `src/components/ui/typography/index.ts`

```typescript
export { Text } from './Text';
export { Heading } from './Heading';
```

---

### 3.3 Form Components

#### `src/components/ui/forms/Button.tsx`

```typescript
import React from 'react';
import { Button as GluestackButton, ButtonText } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type GluestackButtonProps = ComponentProps<typeof GluestackButton>;

interface ButtonProps extends Omit<GluestackButtonProps, 'children'> {
  title?: string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ title, children, ...rest }) => {
  return (
    <GluestackButton {...rest}>
      {children || (title && <ButtonText>{title}</ButtonText>)}
    </GluestackButton>
  );
};
```

#### `src/components/ui/forms/Input.tsx`

```typescript
import React from 'react';
import { Input as GluestackInput, InputField } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type InputProps = ComponentProps<typeof GluestackInput> & {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
};

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  ...rest
}) => {
  return (
    <GluestackInput {...rest}>
      <InputField
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    </GluestackInput>
  );
};
```

#### `src/components/ui/forms/index.ts`

```typescript
export { Button } from './Button';
export { Input } from './Input';
// Add more form components as needed
```

---

### 3.4 Feedback Components

#### `src/components/ui/feedback/Spinner.tsx`

```typescript
import React from 'react';
import { Spinner as GluestackSpinner } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type SpinnerProps = ComponentProps<typeof GluestackSpinner>;

export const Spinner: React.FC<SpinnerProps> = props => {
  return <GluestackSpinner {...props} />;
};
```

#### `src/components/ui/feedback/Alert.tsx`

```typescript
import React from 'react';
import {
  Alert as GluestackAlert,
  AlertIcon,
  AlertText,
} from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type GluestackAlertProps = ComponentProps<typeof GluestackAlert>;

interface AlertProps extends Omit<GluestackAlertProps, 'children'> {
  message?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  message,
  showIcon = true,
  children,
  ...rest
}) => {
  return (
    <GluestackAlert {...rest}>
      {showIcon && <AlertIcon />}
      {children || (message && <AlertText>{message}</AlertText>)}
    </GluestackAlert>
  );
};
```

#### `src/components/ui/feedback/index.ts`

```typescript
export { Spinner } from './Spinner';
export { Alert } from './Alert';
// Add more feedback components as needed
```

---

### 3.5 Central Export File

#### `src/components/ui/index.ts`

```typescript
// Layout Components
export * from './layout';

// Typography Components
export * from './typography';

// Form Components
export * from './forms';

// Feedback Components
export * from './feedback';

// Overlay Components
export * from './overlay';

// Media Components
export * from './media';

// Disclosure Components
export * from './disclosure';

// Navigation Components
export * from './navigation';

// Data Display Components
export * from './data-display';

// Utility Components
export * from './utility';
```

---

## 📱 4. Example Usage Screen

#### `src/screens/LoginScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  Spinner,
} from '../components/ui';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Login logic here
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Box flex={1} bg="$white" p="$4">
      <VStack space="lg" alignItems="center" justifyContent="center" flex={1}>
        <Heading size="2xl" color="$primary500">
          Welcome Back
        </Heading>

        <Text size="md" color="$gray600">
          Sign in to continue to your account
        </Text>

        <VStack space="md" w="$full" maxWidth={400}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            isDisabled={loading}
          />

          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            isDisabled={loading}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            size="lg"
            isDisabled={loading}
          >
            {loading && <Spinner color="$white" />}
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};
```

---

## 🎯 5. Benefits and Best Practices

### Benefits of This Approach

1. **Easy Library Migration** 🔄

   - Switch from Gluestack UI to another library without refactoring the entire app
   - Only update files in `src/components/ui/` directory

2. **Consistent API** 🎨

   - Create a unified interface across your application
   - Custom props like `title` on Button component

3. **Better Maintenance** 🛠️

   - Single source of truth for all UI components
   - Easier to apply global styling changes

4. **Type Safety** 📘

   - Full TypeScript support with proper type inference
   - Catch errors at compile time

5. **Testing** 🧪

   - Mock UI components in one place for testing
   - Test business logic without dependency on UI library

6. **Team Collaboration** 👥
   - Clear separation of concerns
   - New developers don't need to learn third-party library details

---

## 🆕 6. How to Add a New Component

### Step-by-Step Guide

**Example: Adding a `Modal` component**

#### Step 1: Create the wrapper file

Create `src/components/ui/overlay/Modal.tsx`:

```typescript
import React from 'react';
import {
  Modal as GluestackModal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';

type ModalProps = ComponentProps<typeof GluestackModal>;

// Main Modal wrapper
export const Modal: React.FC<ModalProps> = props => {
  return <GluestackModal {...props} />;
};

// Export sub-components
export const ModalBackdrop = (
  props: ComponentProps<typeof GluestackModalBackdrop>,
) => <GluestackModalBackdrop {...props} />;

export const ModalContent = (
  props: ComponentProps<typeof GluestackModalContent>,
) => <GluestackModalContent {...props} />;

export const ModalHeader = (
  props: ComponentProps<typeof GluestackModalHeader>,
) => <GluestackModalHeader {...props} />;

export const ModalCloseButton = (
  props: ComponentProps<typeof GluestackModalCloseButton>,
) => <GluestackModalCloseButton {...props} />;

export const ModalBody = (props: ComponentProps<typeof GluestackModalBody>) => (
  <GluestackModalBody {...props} />
);

export const ModalFooter = (
  props: ComponentProps<typeof GluestackModalFooter>,
) => <GluestackModalFooter {...props} />;
```

#### Step 2: Export from category index

Update `src/components/ui/overlay/index.ts`:

```typescript
export * from './Modal';
export * from './Popover';
export * from './Tooltip';
// ... other overlay components
```

#### Step 3: Use in your application

```typescript
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../components/ui';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>Title</ModalHeader>
        <ModalBody>Content here</ModalBody>
        <ModalFooter>Footer buttons</ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

---

## ⚙️ 7. TypeScript Configuration

### Path Aliases Setup

Update your `tsconfig.json` to include path aliases for cleaner imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["src/components/*"],
      "@/ui": ["src/components/ui"],
      "@/screens/*": ["src/screens/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

**Update `babel.config.js` for React Native:**

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@/components': './src/components',
          '@/ui': './src/components/ui',
          '@/screens': './src/screens',
          '@/services': './src/services',
          '@/utils': './src/utils',
          '@/types': './src/types',
        },
      },
    ],
  ],
};
```

**Usage with aliases:**

```typescript
// Before
import { Button, Text } from '../../components/ui';

// After
import { Button, Text } from '@/ui';
```

---

## 🧪 8. Testing Strategy

### Mock UI Components for Testing

Create `src/components/ui/__mocks__/index.ts`:

```typescript
import React from 'react';

// Mock all UI components for testing
export const Box = ({ children, ...props }: any) => (
  <div data-testid="box" {...props}>
    {children}
  </div>
);
export const Text = ({ children, ...props }: any) => (
  <span data-testid="text" {...props}>
    {children}
  </span>
);
export const Button = ({ children, title, onPress, ...props }: any) => (
  <button data-testid="button" onClick={onPress} {...props}>
    {children || title}
  </button>
);
export const VStack = ({ children, ...props }: any) => (
  <div data-testid="vstack" {...props}>
    {children}
  </div>
);
export const HStack = ({ children, ...props }: any) => (
  <div data-testid="hstack" {...props}>
    {children}
  </div>
);
// Add more mocks as needed
```

### Example Test

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';

// Mock the UI components
jest.mock('../components/ui');

describe('LoginScreen', () => {
  it('should render login form', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Welcome Back')).toBeTruthy();
  });

  it('should handle login button press', () => {
    const { getByTestId } = render(<LoginScreen />);
    const button = getByTestId('button');
    fireEvent.press(button);
    // Assert login logic
  });
});
```

---

## 🔄 9. Migration Guide

### Migrating Existing Code

#### Step 1: Find all direct imports

Create a script `scripts/find-direct-imports.sh`:

```bash
#!/bin/bash
echo "Finding direct imports of @gluestack-ui/themed..."
grep -r "from '@gluestack-ui/themed'" src/ --exclude-dir=components/ui
```

#### Step 2: Replace imports

**Before:**

```typescript
import { Box, Text, Button } from '@gluestack-ui/themed';
```

**After:**

```typescript
import { Box, Text, Button } from '@/ui';
```

#### Step 3: Automated migration script

Create `scripts/migrate-imports.js`:

```javascript
const fs = require('fs');
const path = require('path');

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  content = content.replace(
    /import\s+{([^}]+)}\s+from\s+['"]@gluestack-ui\/themed['"]/g,
    "import {$1} from '@/ui'",
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Migrated: ${filePath}`);
}

// Run on all .tsx and .ts files
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('components/ui')) {
      walkDir(filePath);
    } else if (
      stat.isFile() &&
      (file.endsWith('.tsx') || file.endsWith('.ts'))
    ) {
      migrateFile(filePath);
    }
  });
}

walkDir('./src');
```

---

## 🌐 10. Platform-Specific Considerations

### Web and Native Platform Support

For components that need platform-specific implementations:

#### `src/components/ui/forms/Button.tsx`

```typescript
import React from 'react';
import { Button as GluestackButton, ButtonText } from '@gluestack-ui/themed';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

type GluestackButtonProps = ComponentProps<typeof GluestackButton>;

interface ButtonProps extends Omit<GluestackButtonProps, 'children'> {
  title?: string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ title, children, ...rest }) => {
  // Platform-specific behavior
  const buttonProps = Platform.select({
    web: {
      // Web-specific props
      cursor: 'pointer',
    },
    default: rest,
  });

  return (
    <GluestackButton {...buttonProps} {...rest}>
      {children || (title && <ButtonText>{title}</ButtonText>)}
    </GluestackButton>
  );
};
```

---

## 📊 11. Performance Considerations

### Tree-Shaking

Ensure proper tree-shaking by using named exports:

```typescript
// ✅ Good - Tree-shakeable
export { Button } from './Button';
export { Input } from './Input';

// ❌ Bad - Not tree-shakeable
export default { Button, Input };
```

### Lazy Loading

For large components (like complex data tables), use lazy loading:

```typescript
import { lazy } from 'react';

export const Table = lazy(() => import('./Table'));
```

---

## 🚀 12. Implementation Checklist

- [ ] Create folder structure (`layout/`, `forms/`, `feedback/`, etc.)
- [ ] Implement wrapper components for all 62 components
- [ ] Create category-specific `index.ts` files
- [ ] Create central `src/components/ui/index.ts` barrel export
- [ ] Set up TypeScript path aliases in `tsconfig.json`
- [ ] Configure Babel module resolver for React Native
- [ ] Create mock files for testing
- [ ] Migrate existing direct imports
- [ ] Create example usage screens
- [ ] Document custom component additions
- [ ] Set up automated import checking in CI/CD
- [ ] Add ESLint rule to prevent direct imports outside `ui/` directory

---

## 🔒 13. ESLint Rule to Enforce Abstraction

Add this to your `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@gluestack-ui/themed',
            message:
              'Please import from @/ui instead to maintain abstraction layer.',
          },
        ],
        patterns: [
          {
            group: ['@gluestack-ui/*'],
            message:
              'Please import from @/ui instead to maintain abstraction layer.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Allow direct imports only in the ui components directory
      files: ['src/components/ui/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
```

---

## 📚 Additional Resources

- [Gluestack UI Documentation](https://gluestack.io/ui/docs)
- [All Components List](https://gluestack.io/ui/docs/components/all-components)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

## 🎉 Conclusion

This abstraction layer provides:

- ✅ **62+ UI components** ready to use
- ✅ **Easy library migration** capability
- ✅ **Type-safe** implementation
- ✅ **Platform compatibility** (Web + Native)
- ✅ **Testing support** with mocks
- ✅ **Clean architecture** with clear separation of concerns
- ✅ **Developer experience** improvements with path aliases

**Remember:** The key principle is that only files within `src/components/ui/` should import from `@gluestack-ui/themed`. All other parts of the application should import from `@/ui`.
