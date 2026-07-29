import React from 'react';
import { Container, VStack } from '@ui';
import styles from '../styles';
import Test from '../components/Test';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  
  return (
    <VStack flex={1}>
      <SPTitleHeader
        title="Create Training Session"
        backButtonText="Chnage type"
        onNavigateBack={() => navigation.goBack()}
      />
      <Container {...styles.container}>
        <Test />
      </Container>
    </VStack>
  );
};

export default App;
