import React from 'react';
import { Container, VStack } from '@ui';
import styles from '../styles';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  
  return (
    <VStack flex={1}>
      <SPTitleHeader
        title="Create Additional Service"
        backButtonText="Chnage type"
        onNavigateBack={() => navigation.goBack()}
      />
      <Container {...styles.container}>
        <VStack />
      </Container>
    </VStack>
  );
};

export default App;
