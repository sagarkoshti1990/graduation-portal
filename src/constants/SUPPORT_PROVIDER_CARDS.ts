import { FeatureCardData } from '@app-types/components';

export const SUPPORT_PROVIDER_CARDS: FeatureCardData[] = [
  {
    id: 'training',
    color: '#0284C7', // Blue color
    icon: 'GraduationCap',
    title: 'supportProvider.createSupport.cards.training.title',
    description: 'supportProvider.createSupport.cards.training.description',
    navigationUrl: 'form-training-session',
  },
  {
    id: 'additional-services',
    color: '#7C3AED', // Purple color
    icon: 'Briefcase',
    title: 'supportProvider.createSupport.cards.additionalServices.title',
    description: 'supportProvider.createSupport.cards.additionalServices.description',
    navigationUrl: 'create-additional-service',
  },
  {
    id: 'assets',
    color: '#16A34A', // Green color
    icon: 'Package',
    title: 'supportProvider.createSupport.cards.assets.title',
    description: 'supportProvider.createSupport.cards.assets.description',
    navigationUrl: 'create-asset',
  },
];

export const FORM_MODE = {
  CREATE: 'create',
  EDIT: 'edit',
  COPY: 'copy',
} as const;

export type FormModeType = typeof FORM_MODE[keyof typeof FORM_MODE];

export const SESSION_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export const DEFAULT_SESSION_CONFIG = {
  TIMEZONE: 'Asia/Kolkata',
  SESSION_TYPE: 'Public',
} as const;

export const REQUEST_SUPPORT_OPTIONS = [
  {
    id: 'training',
    icon: 'Calendar',
    title: 'Session or Training',
    description: 'Request a training session',
    route: 'sessions-support/request',
  },
  {
    id: 'additional-services',
    icon: 'Wrench',
    title: 'Additional Service',
    description: 'Request a support service',
    route: 'create-additional-service',
  },
  {
    id: 'assets',
    icon: 'Box',
    title: 'Asset',
    description: 'Request equipment or resources',
    route: 'create-asset',
  },
];

