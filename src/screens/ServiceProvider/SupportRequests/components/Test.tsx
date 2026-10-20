import React, { memo } from 'react';
import { Text } from '@ui';
import styles from '../styles';

const Test = (): React.JSX.Element => {
  return (<Text {...styles.title}>Your Body UI code</Text>);
};

export default memo(Test);