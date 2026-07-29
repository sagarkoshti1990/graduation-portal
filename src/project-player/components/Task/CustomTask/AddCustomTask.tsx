import React, { useState } from 'react';
import { Box, HStack, Text, Pressable, ButtonText, ButtonIcon, Button } from '@gluestack-ui/themed';
import { LucideIcon } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { theme } from '@config/theme';
import { useProjectContext } from '../../../context/ProjectContext';
import AddCustomTaskModal from './AddCustomTaskModal';
import { addCustomTaskStyles } from './styles';
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
      <Button
      // @ts-ignore
        variant="outlineghost"
        mb="$4" onPress={handleOpenModal}
      >
        <ButtonIcon as={LucideIcon} name="Plus" />
        <ButtonText>{t('projectPlayer.addCustomTask')}</ButtonText>
      </Button>

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
