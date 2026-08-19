import React from 'react';
import { HStack, Text, Button, ButtonText } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles';

interface RequestFooterProps {
  item: any;
}

export const RequestFooter: React.FC<RequestFooterProps> = ({ item }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();

  const sessionId = item?.id || item?._id || '';
  const orgName = (typeof item?.organization === 'object'
    ? item.organization?.name || item.organization?.organization_code
    : item?.organization) || item?.organization_code || '';
  const provinceName = (Array.isArray(item?.provinces) ? item.provinces[0] : item?.provinces) || '';

  const handleViewDetails = () => {
    // @ts-ignore
    navigation.navigate('SessionDetails', { sessionId });
  }
  const handleAssignSession = () => {
    // @ts-ignore
    navigation.navigate('AssignSession', { sessionId });
  }

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
          onPress={handleViewDetails}
        >
          <ButtonText {...(styles.requestorFooterViewDetailsText as any)}>
            {t('supportProvider.supportOfferings.cards.viewDetails', 'View Details')}
          </ButtonText>
        </Button>

        <Button
          variant="solid"
          {...styles.requestorFooterAssignButton}
          onPress={handleAssignSession}
        >
          <ButtonText {...(styles.requestorFooterAssignText as any)}>
            {t('supportProvider.supportOfferings.cards.assignSession', 'Assign Session')}
          </ButtonText>
        </Button>
      </HStack>
    </HStack>
  );
};
