import React from 'react';
import { Box, VStack, Text, Heading } from '@gluestack-ui/themed';
import { Container } from '@ui';
import FeatureCard from '@components/FeatureCard';
import { useAuth } from '@contexts/AuthContext';
import { theme } from '@config/theme';
import { TYPOGRAPHY } from '@constants/TYPOGRAPHY';
import { useLanguage } from '@contexts/LanguageContext';
import { WELCOME_CARDS } from '@constants/WELCOME_CARDS';

const WelcomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      bg={theme.tokens.colors.error50}
    >
      <Container padding="$5" $md-padding="$6">
        <VStack space="2xl" alignItems="center">
          {/* Welcome Header */}
          <VStack
            space="sm"
            alignItems="center"
            marginTop="$8"
            marginBottom="$4"
          >
            <Heading {...TYPOGRAPHY.h1} color="$textDark900" textAlign="center">
              {t('welcome.welcomeBack')}
              {user?.name ? `, ${user.name}` : ''}
            </Heading>
            <Text {...TYPOGRAPHY.paragraph} color="$textDark600">
              {t('welcome.chooseOptionBelowToGetStarted')}
            </Text>
          </VStack>

          {/* Cards Grid */}
          <Box
            flexDirection="column"
            $md-flexDirection="row"
            gap="$5"
            $md-gap="$6"
            width="$full"
          >
            {WELCOME_CARDS.map(card => (
              <Box key={card.id} width="$full" $md-width="33.33%" $md-flex={1}>
                <FeatureCard card={card} />
              </Box>
            ))}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default WelcomePage;
