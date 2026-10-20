import React from 'react';
import { Container, VStack, HStack } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';
import { SUPPORT_PROVIDER_CARDS } from '@constants/SUPPORT_PROVIDER_CARDS';
import SupportCard from './components/SupportCard';
import { useProfileCompletion } from '@hooks';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { isCardAllowed } = useProfileCompletion();
  const handleBackPress = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore
      navigation.navigate('opportunities');
    }
  }

  return (
    <VStack flex={1} bg="$backgroundLight50">
      <SPTitleHeader
        title={t('supportProvider.createSupport.title', 'Create New Support')}
        subTitle={t('supportProvider.createSupport.subtitle', 'Choose the type of support you want to create')}
        backButtonText={t('common.backToDashboard', ' Back to Dashboard')}
        onNavigateBack={handleBackPress}
      />
      <Container {...styles.container}>
        <HStack
          flexDirection="column"
          $md-flexDirection="row"
          space="xl"
          mt="$6"
          width="100%"
        >
          {SUPPORT_PROVIDER_CARDS.map((card, index) => (
            <SupportCard
              key={index}
              card={card}
              isAllowed={isCardAllowed(card.id)}
            />
          ))}
        </HStack>
      </Container>
    </VStack>
  );
};
export default App;
