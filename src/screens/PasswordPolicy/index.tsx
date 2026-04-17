import React from 'react';
import { ScrollView } from 'react-native';
import { passwordPolicyStyles } from './Styles';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  LucideIcon,
} from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { theme } from '@config/theme';
import { REQUIREMENTS_KEYS } from '@constants/PASSWORD_POLICY_DATA';

const PasswordPolicy = () => {
  const { t } = useLanguage();

  const REQUIREMENTS_DATA = {
    strength: {
      title: t(REQUIREMENTS_KEYS.strength.titleKey),
      items: (t(REQUIREMENTS_KEYS.strength.itemsKey, { returnObjects: true }) as unknown) as string[]
    },
    process: {
      title: t(REQUIREMENTS_KEYS.process.titleKey),
      items: (t(REQUIREMENTS_KEYS.process.itemsKey, { returnObjects: true }) as unknown) as string[]
    }
  };


  return (
    <ScrollView {...passwordPolicyStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <VStack {...passwordPolicyStyles.headerContainer}>
        <HStack {...passwordPolicyStyles.headerRow}>
          <LucideIcon name="Lock" size={28} color={theme.tokens.colors.textPrimary} />
          <Heading {...passwordPolicyStyles.pageTitle}>{t('admin.passwordPolicyPage.pageTitle')}</Heading>
        </HStack>
        <Text {...passwordPolicyStyles.pageSubtitle}>{t('admin.passwordPolicyPage.pageSubtitle')}</Text>
      </VStack>

      {/* Section 1: Hierarchy */}
      {/* Section 2: Requirements */}
      <Box {...passwordPolicyStyles.innerSectionContainer}>
        <Box {...passwordPolicyStyles.sectionHeader}>
          <LucideIcon name="ShieldCheck" size={20} color={theme.tokens.colors.textPrimary} />
          <Heading {...passwordPolicyStyles.sectionTitle} flex={1}>{t('admin.passwordPolicyPage.section2.title')}</Heading>
        </Box>

        <Box {...passwordPolicyStyles.requirementsGrid}>
          <Box {...passwordPolicyStyles.requirementColumn}>
            <Text {...passwordPolicyStyles.columnTitle}>{REQUIREMENTS_DATA.strength.title}</Text>
            <VStack space="xs">
              {REQUIREMENTS_DATA.strength.items.map((item, idx) => (
                <HStack key={idx} alignItems="center" space="sm">
                  <Box {...passwordPolicyStyles.bullet} />
                  <Text {...passwordPolicyStyles.listItemText}>{item}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>

          <Box {...passwordPolicyStyles.requirementColumn}>
            <Text {...passwordPolicyStyles.columnTitle}>{REQUIREMENTS_DATA.process.title}</Text>
            <VStack space="xs">
              {REQUIREMENTS_DATA.process.items.map((item, idx) => (
                <HStack key={idx} alignItems="flex-start" space="sm">
                  <Box {...passwordPolicyStyles.bullet} />
                  <Text {...passwordPolicyStyles.listItemText}>{item}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Box>
      </Box>
    </ScrollView>
  );
};

export default PasswordPolicy;
