import React from 'react';
import { Button, ButtonIcon, ButtonText, Container, LucideIcon, VStack } from '@ui';
import styles from './styles';
import SupportProviderDashboard from '../../SupportProviderDashboard';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('supportProvider.dashboard.title', 'Support Provider Dashboard')}
        subTitle={t('supportProvider.dashboard.subtitle', 'Overview of your support commitments, intervention fulfillment tracking & performance portfolio')}
        rightSection={
          <Button
            onPress={() => navigation.navigate('create-opportunity' as never)}
          >
            <ButtonIcon as={LucideIcon} name={'Plus'} />
            <ButtonText>{t('supportProvider.dashboard.createSupportBtn', 'Create Support Intervention')}</ButtonText>
          </Button>
        }
      />
      <Container {...styles.container}>
        <SupportProviderDashboard variant="mentor" />
      </Container>
    </VStack>
  );
};

export default App;
