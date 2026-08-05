import React from 'react';
import type { LucideProps } from 'lucide-react-native';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart,
  BookOpen,
  Bell,
  Box,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  ChartColumn,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleCheck,
  CircleDot,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  FileDown,
  FilePenLine,
  FileText,
  FileUp,
  FileX,
  Filter,
  Folder,
  GraduationCap,
  Heart,
  History,
  Home,
  ImageOff,
  Info,
  Key,
  LayoutDashboard,
  LoaderCircle,
  Link2,
  ListChecks,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MoreVertical,
  Paperclip,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Square,
  SquareCheckBig,
  SquarePen,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  WifiOff,
  Wifi,
  CloudUpload,
  X,
  XCircle,
  Trash2,
  MessageSquare,
  Copy,
  CircleCheckBig,
  Video
} from 'lucide-react-native';
import { theme } from '@config/theme';

/**
 * Platform-agnostic Lucide Icon wrapper
 * Automatically uses lucide-react for web and lucide-react-native for native platforms
 */

// Type definition for icon component props
export interface LucideIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?:any;
}

const ICONS: Record<string, React.ComponentType<any>> = {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart,
  BookOpen,
  Bell,
  Box,
  Briefcase,
  Building: Building2,
  Building2,
  Calendar,
  Camera,
  Certificate: Award,
  ChartColumn,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleCheck,
  CircleDot,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  FileDown,
  FilePenLine,
  FileText,
  FileUp,
  FileX,
  Filter,
  Folder,
  GraduationCap,
  Heart,
  History,
  Home,
  ImageOff,
  Info,
  Key,
  LayoutDashboard,
  LoaderCircle,
  Link2,
  ListChecks,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MoreVertical,
  Paperclip,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Square,
  SquareCheckBig,
  SquarePen,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  WifiOff,
  Wifi,
  CloudUpload,
  X,
  XCircle,
  Trash2,
  MessageSquare,
  Copy,
  CircleCheckBig,
  Video
};

/**
 * LucideIcon Component
 * A cross-platform wrapper for Lucide icons
 *
 * @param name - The name of the icon (e.g., 'Search', 'Home', 'User')
 * @param size - Icon size in pixels (default: 24)
 * @param color - Icon color (default: 'currentColor')
 * @param strokeWidth - Stroke width (default: 2)
 *
 * @example
 * ```tsx
 * <LucideIcon name="Search" size={20} color="#000" />
 * ```
 */
const LucideIcon: React.FC<LucideIconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  ...props
}) => {
  const IconComponent = ICONS[name];
  let iconColor: string = theme.tokens.colors.primary500 as string; // Default

  if (typeof color === 'string') {
    if (color.startsWith('$')) {
      // Remove '$' and look up in theme.tokens.colors
      const colorKey = color.slice(1);
      iconColor = theme.tokens.colors?.[colorKey as keyof typeof theme.tokens.colors] as string || theme.tokens.colors.primary500 as string;
    } else if (color.startsWith('#')) {
      iconColor = color as string;
    } else {
      // fallback: use as is or default
      iconColor = color as string || theme.tokens.colors.primary500 as string;
    }
  }

  if (!IconComponent) {
    console.warn(`Lucide icon "${name}" not found`);
    return null;
  }

  return <IconComponent size={size} strokeWidth={strokeWidth} color={iconColor} {...props} />;
};

export default LucideIcon;
