import React from 'react';
import { Container, VStack } from '@ui';
import styles from '../styles';
import Test from '../components/Test';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';
import SchemaFormRenderer from '@components/SchemaFormRenderer';
import { TRAINING_FORM_SCHEMA } from '@constants/TRAINING_FORM_SCHEMA';
import { useLanguage } from '@contexts/LanguageContext';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  const { t } = useLanguage();

  return (
    <VStack flex={1}>
      <SPTitleHeader
        title="Create Training Session"
        backButtonText="Chnage type"
        onNavigateBack={() => navigation.goBack()}
      />
      <Container {...styles.container}>
        <SchemaFormRenderer schema={TRAINING_FORM_SCHEMA} t={t} />
      </Container>
    </VStack>
  );
};

export default App;
