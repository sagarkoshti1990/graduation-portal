import React from 'react';
import { HStack, Text, Button, ButtonText } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import styles from '../styles';

interface RequestFooterProps {
  orgName: string;
  provinceName?: string;
  onViewDetails: () => void;
  onAssignSession: () => void;
}

export const RequestFooter: React.FC<RequestFooterProps> = ({
  orgName,
  provinceName,
  onViewDetails,
  onAssignSession,
}) => {
  const { t } = useLanguage();

  return (
    <HStack {...styles.requestorFooter}>
      <Text {...styles.requestorFooterText}>
        {t('supportProvider.supportOfferings.cards.providedBy', 'Provided by:')}{' '}
        <Text {...styles.requestorFooterOrgText} fontWeight="700">
          {orgName}
        </Text>
        {provinceName ? (
          <Text {...styles.requestorFooterProvinceText}>{` • ${provinceName}`}</Text>
        ) : null}
      </Text>

      <HStack {...styles.requestorFooterActions}>
        <Button
          variant={"outlineghost" as any}
          {...styles.requestorFooterViewDetailsButton}
          onPress={onViewDetails}
        >
          <ButtonText {...(styles.requestorFooterViewDetailsText as any)}>
            {t('supportProvider.supportOfferings.cards.viewDetails', 'View Details')}
          </ButtonText>
        </Button>

        <Button
          variant="solid"
          {...styles.requestorFooterAssignButton}
          onPress={onAssignSession}
        >
          <ButtonText {...(styles.requestorFooterAssignText as any)}>
            {t('supportProvider.supportOfferings.cards.assignSession', 'Assign Session')}
          </ButtonText>
        </Button>
      </HStack>
    </HStack>
  );
};
