import React from 'react';
import { Button, ButtonIcon, ButtonText, Container, LucideIcon, VStack } from '@ui';
import styles from './styles';
import Test from './components/Test';
import SPTitleHeader from '@components/Header/SPTitleHeader';

const App = (): React.JSX.Element => {
  return (
    <VStack flex={1}>
      <SPTitleHeader
        title="Organisation Profile"
        subTitle="Manage your organisation's information and support coverage"
        rightSection={
          <Button>
            <ButtonIcon as={LucideIcon} name={'SquarePen'} />
            <ButtonText>Edit Profile</ButtonText>
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
