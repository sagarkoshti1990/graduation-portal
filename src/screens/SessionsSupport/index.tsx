import React, { useState } from 'react';
import { Box, Button, ButtonIcon, ButtonText, Container, HStack, LucideIcon, Pressable, Text, VStack } from '@ui';
import { useLanguage } from '@contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '@components/PageHeader';
import { REQUEST_SUPPORT_OPTIONS } from '@constants/SUPPORT_PROVIDER_CARDS';
import styles from './styles';

const SessionsSupportScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSelectOption = (route: string) => {
    setIsDropdownOpen(false);
    if (route) {
      navigation.navigate(route as never);
    }
  };

  const titleNode = (
    <HStack {...styles.headerTitleHStack}>
      <LucideIcon name="LifeBuoy" size={24} color="#8B2842" />
      <Text {...styles.headerTitleText}>
        {t('lc.pageTitle.sessions-support')}
      </Text>
    </HStack>
  );

  return (
    <VStack {...styles.container}>
      <PageHeader
        title={titleNode}
        subtitle={t('lc.sessionsSupport.subtitle')}
        rightSection={
          <Box {...styles.rightSectionBox}>
            <HStack {...styles.rightSectionHStack}>
              <Button
                {...styles.createSessionBtn}
                onPress={() => navigation.navigate('sessions-support/create' as never)}
              >
                <ButtonIcon as={LucideIcon} name="Plus" size={16} color="$textForegroundColor" />
                <ButtonText {...styles.createSessionBtnText}>
                  {t('lc.sessionsSupport.createSession')}
                </ButtonText>
              </Button>
              <Button
                {...styles.requestSupportBtn}
                onPress={() => setIsDropdownOpen(prev => !prev)}
              >
                <ButtonIcon as={LucideIcon} name="Plus" size={16} color="$white" />
                <ButtonText {...styles.requestSupportBtnText}>
                  {t('lc.sessionsSupport.requestSupport')}
                </ButtonText>
              </Button>
            </HStack>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <Pressable
                  {...styles.backdropPressable}
                  onPress={() => setIsDropdownOpen(false)}
                />
                <Box {...styles.dropdownBox}>
                  <VStack>
                    {REQUEST_SUPPORT_OPTIONS.map((item, idx) => (
                      <Pressable
                        key={item.id}
                        {...styles.dropdownItemPressable}
                        borderBottomWidth={idx !== REQUEST_SUPPORT_OPTIONS.length - 1 ? 1 : 0}
                        borderBottomColor="$borderLight100"
                        onPress={() => handleSelectOption(item.route)}
                      >
                        <HStack {...styles.dropdownItemHStack}>
                          <Box {...styles.dropdownItemIconBox}>
                            <LucideIcon name={item.icon} size={18} color="#8B2842" />
                          </Box>
                          <VStack {...styles.dropdownItemVStack}>
                            <Text {...styles.dropdownItemTitle}>
                              {item.title}
                            </Text>
                            <Text {...styles.dropdownItemDescription}>
                              {item.description}
                            </Text>
                          </VStack>
                        </HStack>
                      </Pressable>
                    ))}
                  </VStack>
                </Box>
              </>
            )}
          </Box>
        }
      />
      <Container {...styles.contentContainer}>
        <VStack {...styles.contentVStack}>
          <Text {...styles.comingSoonText}>
            {t('common.comingSoon', { defaultValue: 'Content coming soon...' })}
          </Text>
        </VStack>
      </Container>
    </VStack>
  );
};

export default SessionsSupportScreen;
