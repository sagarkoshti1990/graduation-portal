import React, { useState } from 'react';
import { Box, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { theme } from '@config/theme';
import { useProjectContext } from '../../context/ProjectContext';
import AddCustomTaskModal from './AddCustomTaskModal';
import { addCustomTaskStyles } from './Styles';
import { AddCustomTaskProps } from 'src/project-player/types';

const AddCustomTask: React.FC<AddCustomTaskProps> = ({
  templateId,
  templateName,
}) => {
  const { t } = useLanguage();
  const { config } = useProjectContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if AddCustomTask button should be shown (default to true if not specified)
  const shouldShowButton = config.showAddCustomTaskButton !== false;

  // Don't render if config says not to show
  if (!shouldShowButton) {
    return null;
  }

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Add Task Button */}
      <Pressable onPress={handleOpenModal}>
        {(state: any) => {
          const isHovered = state?.hovered || state?.pressed || false;
          return (
            <Box
              {...addCustomTaskStyles.buttonBox}
              bg={isHovered ? '$primary100' : '$accent100'}
              borderColor={isHovered ? '$primary500' : '$mutedBorder'}
            >
              <HStack {...addCustomTaskStyles.buttonContent}>
                <LucideIcon
                  name="Plus"
                  size={18}
                  color={isHovered ? theme.tokens.colors.primary700 : theme.tokens.colors.primary500}
                  strokeWidth={2.5}
                />
                <Text
                  {...TYPOGRAPHY.button}
                  color={isHovered ? "$primary700" : "$primary500"}
                  fontWeight="$semibold"
                >
                  {t('projectPlayer.addCustomTask')}
                </Text>
              </HStack>
            </Box>
          );
        }}
      </Pressable>

      {/* Add Custom Task Modal */}
      <AddCustomTaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        templateId={templateId}
        templateName={templateName}
        mode="add"
      />
    </>
  );
};

export default AddCustomTask;
