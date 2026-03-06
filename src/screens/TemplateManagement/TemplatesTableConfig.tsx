import React from 'react';
import { HStack, Text, Pressable, VStack } from '@ui';
import { ColumnDef } from '@app-types/components';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { LucideIcon, Menu } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import { Template } from '@constants/TEMPLATE_MANAGEMENT_MOCK_DATA';
import { styles as dataTableStyles } from '@components/DataTable/Styles';
import { MenuItemData } from '@components/ui/Menu';
import { templateManagementStyles as styles } from './Styles';
import logger from '@utils/logger';

/**
 * Status Badge Component
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status === 'Active';

  return (
    <HStack
      {...(isActive ? styles.statusBadgeActive : styles.statusBadgeInactive)}
      {...styles.statusBadge}
    >
      <Text
        {...TYPOGRAPHY.bodySmall}
        {...styles.statusBadgeText}
      >
        {status}
      </Text>
    </HStack>
  );
};

/**
 * Custom trigger for actions menu
 */
const getCustomTrigger = (triggerProps: any) => (
  <Pressable {...triggerProps} {...dataTableStyles.customTrigger}>
    <LucideIcon
      name="MoreVertical"
      size={20}
      color={theme.tokens.colors.textForeground}
    />
  </Pressable>
);

/**
 * Get Template Menu Items
 */
const getTemplateMenuItems = (_t: (key: string) => string): MenuItemData[] => [
  {
    key: 'view',
    label: 'admin.templates.actionMenu.view',
    textValue: 'View (Read-Only)',
    iconName: 'Eye',
    iconColor: theme.tokens.colors.textMutedForeground,
    iconSizeValue: 16,
  },
  {
    key: 'deactivate',
    label: 'admin.templates.actionMenu.deactivate',
    textValue: 'Deactivate',
    iconName: 'XCircle',
    iconColor: theme.tokens.colors.textMutedForeground,
    iconSizeValue: 16,
  },
  {
    key: 'export',
    label: 'admin.templates.actionMenu.export',
    textValue: 'Export as CSV',
    iconName: 'Download',
    iconColor: theme.tokens.colors.textMutedForeground,
    iconSizeValue: 16,
  },
];

/**
 * Actions Column Component
 */
const ActionsColumn: React.FC<{ template: Template }> = ({ template }) => {
  const { t } = useLanguage();

  const handleMenuSelect = (key: string) => {
    switch (key) {
      case 'view':
        logger.log('View template:', template.id);
        // TODO: Navigate to template view (read-only)
        break;
      case 'deactivate':
        logger.log('Deactivate template:', template.id);
        // TODO: Implement deactivate logic
        break;
      case 'export':
        logger.log('Export template:', template.id);
        // TODO: Implement export logic
        break;
      default:
        logger.log('Action:', key, 'for template:', template.id);
    }
  };

  const menuItems = getTemplateMenuItems(t);

  return (
    <Menu
      items={menuItems}
      placement="bottom right"
      offset={5}
      trigger={getCustomTrigger}
      onSelect={handleMenuSelect}
    />
  );
};

/**
 * Template Name Cell Component
 */
const TemplateNameCell: React.FC<{ template: Template }> = ({ template }) => {
  const { t } = useLanguage();
  
  return (
    <VStack space="xs">
      <Text {...TYPOGRAPHY.paragraph} {...styles.templateNameText}>
        {template.templateName}
      </Text>
      <Text {...TYPOGRAPHY.bodySmall} {...styles.uploadedViaText}>
        {t('admin.templates.uploadedViaCsv')}
      </Text>
    </VStack>
  );
};

/**
 * Tasks Cell Component
 */
const TasksCell: React.FC<{ template: Template }> = ({ template }) => {
  const { t } = useLanguage();
  
  return (
    <Text {...TYPOGRAPHY.paragraph} {...styles.tasksText}>
      {template.tasks} {t('admin.templates.tasksLabel')}
    </Text>
  );
};

/**
 * All possible columns for Templates Table
 */
export const getTemplatesColumns = (): ColumnDef<Template>[] => [
  {
    key: 'templateName',
    label: 'admin.templates.templateName',
    flex: 2.5,
    render: (template) => <TemplateNameCell template={template} />,
    mobileConfig: {
      leftRank: 1,
      showLabel: false,
    },
  },
  {
    key: 'status',
    label: 'admin.templates.status',
    flex: 1,
    render: (template) => <StatusBadge status={template.status} />,
    mobileConfig: {
      rightRank: 1,
      showLabel: false,
    },
  },
  {
    key: 'creator',
    label: 'admin.templates.creator',
    flex: 1.2,
    render: (template) => (
      <Text {...TYPOGRAPHY.paragraph} {...styles.creatorText}>
        {template.creator}
      </Text>
    ),
    mobileConfig: {
      leftRank: 2,
      showLabel: false,
    },
  },
  {
    key: 'tasks',
    label: 'admin.templates.tasks',
    flex: 1,
    render: (template) => <TasksCell template={template} />,
    mobileConfig: {
      rightRank: 2,
      showLabel: false,
    },
  },
  {
    key: 'createdDate',
    label: 'admin.templates.createdDate',
    flex: 1.2,
    render: (template) => (
      <Text {...TYPOGRAPHY.paragraph} {...styles.createdDateText}>
        {template.createdDate}
      </Text>
    ),
    mobileConfig: {
      leftRank: 3,
      showLabel: false,
    },
  },
  {
    key: 'actions',
    label: 'admin.templates.actions',
    flex: 0.8,
    render: (template) => <ActionsColumn template={template} />,
    mobileConfig: {
      fullWidthRank: 1,
      showLabel: false,
    },
  },
];

