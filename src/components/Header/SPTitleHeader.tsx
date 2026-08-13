import React from 'react';
import PageHeader from '@components/PageHeader';

const SPTitleHeader = ({
  title,
  subTitle,
  backButtonText,
  onNavigateBack,
  rightSection,
}: {
  title: string | React.ReactNode;
  subTitle?: string;
  backButtonText?: string;
  onNavigateBack?: () => void;
  badgeText?: string;
  rightSection?: any;
}): React.JSX.Element => {
  return (
    <PageHeader
      title={title}
      subtitle={subTitle}
      backButtonText={backButtonText}
      onBackPress={onNavigateBack}
      _title={{ fontSize: '$2xl', lineHeight: '$2xl', fontWeight: 600 }}
      _subtitle={{ lineHeight: '$xl' }}
      _css={{ shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '$borderLight100' }}
      _leftSection={{ flexDirection: 'column', alignItems: 'start' }}
      _content={{ py: '$6', px: '$6' }}
      rightSection={rightSection}
    />
  );
};

export default SPTitleHeader;
