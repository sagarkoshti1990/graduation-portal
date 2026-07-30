import React from 'react';
import { Button, ButtonIcon, ButtonText, Container, LucideIcon, VStack } from '@ui';
import styles from './styles';
import Test from './components/Test';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '@contexts/LanguageContext';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  
  return (
    <VStack flex={1}>
      <SPTitleHeader
        title={t('supportProvider.supportOfferings.title')}
        subTitle={t('supportProvider.supportOfferings.subtitle')}
        rightSection={
          <Button
            onPress={() => navigation.navigate('create-opportunity' as never)}
          >
            <ButtonIcon as={LucideIcon} name={'Plus'} />
            <ButtonText>{t('supportProvider.supportOfferings.createNew')}</ButtonText>
          </Button>
        }
      />
      <Container {...styles.container}>
        <Test />
      </Container>
    </VStack>
  );
};

export default App;
