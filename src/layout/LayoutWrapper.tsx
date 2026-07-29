import React, { ReactNode, ComponentType } from 'react';
import { useAuth } from '@contexts/AuthContext';
import AdminLayout from './admin/Layout';
import LcLayout from './lc/Layout';
import MentorLayout from './mentor/Layout';


// Layout components can accept children and any additional props
export type LayoutComponent = ComponentType<any>;

interface LayoutWrapperProps {
  children: ReactNode;
  /**
   * Optional: Explicitly pass a layout component to override automatic selection
   * If not provided, layout will be automatically selected based on user role
   * Pass null to disable layout wrapping
   */
  layout?: LayoutComponent | null;
  /**
   * Optional: Additional props to pass to the layout component
   * (e.g., title for LcLayout)
   */
  layoutProps?: Record<string, any>;
}

/**
 * LayoutWrapper - Automatically wraps children with the appropriate layout
 * based on user role, or uses the provided layout if specified.
 *
 * Usage in screen components:
 * 1. Automatic (based on role):
 *    <LayoutWrapper>...</LayoutWrapper>
 *
 * 2. Explicit layout:
 *    <LayoutWrapper layout={CustomLayout}>...</LayoutWrapper>
 *
 * 3. No layout:
 *    <LayoutWrapper layout={null}>...</LayoutWrapper>
 */
const LayoutWrapper: React.FC<LayoutWrapperProps> = ({
  children,
  layout,
  layoutProps = {},
}) => {
  const { user } = useAuth();

  // If layout is explicitly null, don't wrap
  if (layout === null) {
    return <>{children}</>;
  }

  // If layout is explicitly provided, use it
  if (layout) {
    const LayoutComponent = layout;
    return <LayoutComponent {...layoutProps}>{children}</LayoutComponent>;
  }

  // Automatic selection based on user role
  const userRole = user?.role?.toLowerCase();
  let SelectedLayout: LayoutComponent;

  switch (userRole) {
    case 'admin':
    case 'supervisor':
      SelectedLayout = AdminLayout as LayoutComponent;
      break;
    case 'lc':
      SelectedLayout = LcLayout as LayoutComponent;
      break;
    case 'mentor':
      SelectedLayout = MentorLayout as LayoutComponent;
      break;
    default:
      // No layout for unknown roles or when not logged in
      return <>{children}</>;
  }

  return <SelectedLayout {...layoutProps}>{children}</SelectedLayout>;
};

export default LayoutWrapper;
