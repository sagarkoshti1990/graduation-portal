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
        title="Dashbord"
        subTitle="Overview of your impact and activities"
        rightSection={
          <Button
            onPress={() => navigation.navigate('create-opportunity' as never)}
          >
            <ButtonIcon as={LucideIcon} name={'Plus'} />
            <ButtonText>Create Support for Participants</ButtonText>
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
