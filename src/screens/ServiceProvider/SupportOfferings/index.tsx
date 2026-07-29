import React from 'react';
import { Button, ButtonIcon, ButtonText, Container, LucideIcon, VStack } from '@ui';
import styles from './styles';
import Test from './components/Test';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  
  return (
    <VStack flex={1}>
      <SPTitleHeader
        title="My Support Offerings"
        subTitle="Manage all published support — training sessions, services, and assets"
        rightSection={
          <Button
            onPress={() => navigation.navigate('create-opportunity' as never)}
          >
            <ButtonIcon as={LucideIcon} name={'Plus'} />
            <ButtonText>Create New</ButtonText>
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
