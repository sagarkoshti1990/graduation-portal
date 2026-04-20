import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Image, VStack } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { loginStyles } from './Styles';
import logoImage from '../../assets/images/logo.png';
import ForgotPasswordContainer from './components/ForgotPasswordContainer';

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useLanguage();

  return (
    <ScrollView {...loginStyles.scrollView}>
      <Box
        {...loginStyles.container}
        $web-backgroundImage={
          'linear-gradient(148.729deg, rgba(117, 0, 63, 0.05) 0%, rgba(117, 0, 63, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)'
        }
      >
        <Box {...loginStyles.box} $web-boxShadow={loginStyles.containerBoxShadow}>
          <VStack {...loginStyles.vstack}>
            {/* @ts-ignore */}
            <Image {...loginStyles.imageLogo} source={logoImage} />
            <ForgotPasswordContainer />
          </VStack>
        </Box>
      </Box>
    </ScrollView>
  );
};

export default ForgotPasswordScreen;
