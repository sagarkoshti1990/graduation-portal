import React from 'react';
import { Button, ButtonIcon, ButtonText, Container, LucideIcon, VStack } from '@ui';
import styles from '../styles';
import Test from '../components/Test';
import SPTitleHeader from '@components/Header/SPTitleHeader';
import { useNavigation } from '@react-navigation/native';

const App = (): React.JSX.Element => {
  const navigation = useNavigation();
  
  return (
    <VStack flex={1}>
      <SPTitleHeader
        title="Create New Support"
        subTitle="Choose the type of support you want to create"
        backButtonText=" Back to Dashboard"
      />
      <Container {...styles.container}>
        <Test />
        <VStack space='2xl' mt="$6">
          <Button
            onPress={() => navigation.navigate('create-training-session' as never)}
          >
            <ButtonIcon as={LucideIcon} name={'Plus'} />
            <ButtonText>Training Session</ButtonText>
          </Button>
          <Button
            onPress={() => navigation.navigate('create-additional-service' as never)}
          >
            <ButtonIcon as={LucideIcon} name={'Plus'} />
            <ButtonText>Additional Service</ButtonText>
          </Button>
          <Button
            onPress={() => navigation.navigate('create-asset' as never)}
          >
            <ButtonIcon as={LucideIcon} name={'Plus'} />
            <ButtonText>Asset</ButtonText>
          </Button>
        </VStack>
      </Container>
    </VStack>
  );
};

export default App;
