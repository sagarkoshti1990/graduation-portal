import React from 'react';
import { Container, VStack } from '@ui';
import styles from './styles';
import Test from './components/Test';
import SPTitleHeader from '@components/Header/SPTitleHeader';

const App = (): React.JSX.Element => {
  return (
    <VStack flex={1}>
      <SPTitleHeader
        title="Template & Resource Library"
        subTitle="Standalone content repository of all workbooks, guides, templates, and manuals uploaded for support offerings."
      />
      <Container {...styles.container}>
        <Test />
      </Container>
    </VStack>
  );
};

export default App;
