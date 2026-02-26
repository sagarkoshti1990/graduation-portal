import React from 'react';
import {
  HStack,
  Text,
  Box,
  Progress,
  ProgressFilledTrack,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { observationStyles } from './Styles';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { StatusBadge } from '@components/ObservationCards';
import { PageHeader } from '@components/PageHeader';

interface HeaderProps {
  title: string;
  progress: number;
  participantInfo: {
    name: string;
    userId: string;
  } | null;
  onBackPress: () => void;
  status: string;
  hideElements?: any;
  _css?: any;
}

const Header: React.FC<HeaderProps> = ({ title, progress, participantInfo, onBackPress, status, hideElements, _css }) => {
  const { t } = useLanguage();

  return (
    <PageHeader
    _content={{ "$md-px": '$0', px: '$0', py: '$0' }}
    _container={{ "$md-px": '$6', px: '$4', py: '$4' }}
    {..._css?.pageHeader}
    {...(!hideElements?.includes('backButton') ? { onBackPress, backButtonText: t('common.back') } : {})}
    >
      {/* Title and Progress Badge Row */}
      <HStack
        {...observationStyles.titleAndProgressContainer}
      >
        {!hideElements?.includes('title') ? (
          <Text {...TYPOGRAPHY.h4}>
            {title}
          </Text>
        ) : null}
        <StatusBadge status={status} preFix={<Text {...TYPOGRAPHY.caption}> {progress}% </Text>} />
      </HStack>

      {/* Progress Bar */}
      <Box {...observationStyles.progressBarContainer}>
        <Progress value={progress} {...observationStyles.progressBar}>
          <ProgressFilledTrack {...observationStyles.progressBarFill} />
        </Progress>
      </Box>

      {/* Participant Name and Date */}
      {participantInfo && (
        <Text {...observationStyles.participantInfoText}>
          {participantInfo.name} • {participantInfo.userId}
        </Text>
      )}
    </PageHeader>
  );
};

export default Header;

