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
