import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Animated, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Box,
  VStack,
  // HStack, // Commented out - Remember Me checkbox UI is hidden but functionality remains
  Text,
  Input,
  InputField,
  Button,
  ButtonText,
  Heading,
  Spinner,
  // Checkbox, // Commented out - Remember Me checkbox UI is hidden but functionality remains
  // CheckboxIndicator, // Commented out - Remember Me checkbox UI is hidden but functionality remains
  // CheckboxIcon, // Commented out - Remember Me checkbox UI is hidden but functionality remains
  // CheckboxLabel, // Commented out - Remember Me checkbox UI is hidden but functionality remains
  // CheckIcon, // Commented out - Remember Me checkbox UI is hidden but functionality remains
  Image,
} from '@ui';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import LucideIcon from '@components/ui/LucideIcon';
import { loginStyles } from './Styles';
// import LanguageSelector from '@components/LanguageSelector/LanguageSelector';
import logger from '@utils/logger';
import offlineStorage from '../../services/offlineStorage';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import { usePlatform } from '@utils/platform';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = usePlatform()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const flashAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const hoverLoginTriggered = useRef(false);

  // Load saved rememberMe preference on mount
  useEffect(() => {
    const loadRememberMePreference = async () => {
      try {
        const savedRememberMe = await offlineStorage.read<boolean>(
          STORAGE_KEYS.AUTH_REMEMBER_ME,
        );
        if (savedRememberMe !== null && savedRememberMe !== undefined) {
          setRememberMe(savedRememberMe);
          logger.info(
            `Loaded Remember Me preference from storage: ${savedRememberMe}`,
          );
        }
      } catch (err) {
        logger.error('Error loading Remember Me preference:', err);
      }
    };
    loadRememberMePreference();
  }, []);

  // Spin animation for logo - slow 120s linear infinite rotation
  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 120000, // 120 seconds for slow rotation
        useNativeDriver: true,
      }),
    );
    spinAnimation.start();
    return () => spinAnimation.stop();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError(t('login.pleaseEnterBothEmailAndPassword'));
      return;
    }

    setLoading(true);

    try {
      // Use the login function from AuthContext with isAdmin flag and rememberMe state
      const result = await login(email, password, isAdminMode, rememberMe);
      if (!result.success) {
        const fallbackMessage = isAdminMode
          ? t('login.adminLoginFailed')
          : t('login.invalidEmailOrPassword');
        const explicitMessages = new Set([
          t('auth.roleNotAuthorized'),
          t('auth.noUserDataInResponse'),
          t('auth.accessTokenRequired'),
          t('auth.errorOccurredDuringLogin'),
        ]);

        setError(
          explicitMessages.has(result.message)
            ? result.message
            : fallbackMessage,
        );
      }
      // AuthContext already handles setting isLoggedIn and user state on success
    } catch (err: any) {
      // Handle error from API
      const errorMessage =
        err?.message || t('login.anErrorOccurredDuringLogin');
      setError(errorMessage);
      logger.error(`${isAdminMode ? 'Admin ' : ''}Login error:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOnEnter = () => {
    if (loading) return;
    if (!email || !password) return;
    handleLogin();
  };

  const handleAdminLoginClick = () => {
    // Trigger fade out/in animation for full page
    Animated.sequence([
      // Fade out
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Switch to admin mode during fade out
      // Using setTimeout to ensure state update happens mid-animation
    ]).start(() => {
      // Switch to admin mode
      setIsAdminMode(true);
      // Fade in
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCancelAdminMode = () => {
    // Fade out animation
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset state during fade out
      setIsAdminMode(false);
      setError('');
      setEmail('');
      setPassword('');
      // Fade in
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <ScrollView {...loginStyles.scrollView}>
      <Box
        {...loginStyles.container}
        $web-backgroundImage={
          'linear-gradient(148.729deg, rgba(117, 0, 63, 0.05) 0%, rgba(117, 0, 63, 0.1) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)'
        }
      >
        {/* @ts-ignore - LanguageSelector accepts menuTriggerProps */}
        {/* <LanguageSelector menuTriggerProps={loginStyles.languageSelector} /> */}
        <Animated.View
          style={{
            ...loginStyles.imageSpinLogo,
            ...(isMobile ? loginStyles.imageSpinLogoSm : {}),
            transform: [{ rotate: spin }],
          }}
        >
          <Image
            source={require('../../assets/images/logo.svg')}
            style={{
              ...loginStyles.imageLogo500,
              ...(isMobile ? loginStyles.imageLogo500Sm : {})
            }}
            alt='bgAnime1'
          />
        </Animated.View>
        <Animated.View
          style={{
            ...loginStyles.imageSpinLogoLeft,
            ...(isMobile ? loginStyles.imageSpinLogoLeftSm : {}),
            transform: [{ rotate: spin }],
          }}
        >
          <Image
            source={require('../../assets/images/logo.svg')}
            style={{
              ...loginStyles.imageLogo500Left,
              ...(isMobile ? loginStyles.imageLogo500LeftSm : {})
            }}
            alt='bgAnime2'
          />
        </Animated.View>
        <Box
          {...loginStyles.box}
          $web-boxShadow={loginStyles.containerBoxShadow}
        >
          <Animated.View style={{ opacity: flashAnim }}>
            <VStack {...loginStyles.vstack}>
              {/* Logo/Brand */}
              {/* @ts-ignore - Image props are valid */}
              <Image
                // style={{...loginStyles.imageLogo}}
                source={require('../../assets/images/logo.png')}
                alt='logo'
              />

              {/* Tagline */}
              <Heading {...loginStyles.heading}>{t('login.title')}</Heading>

              {/* Welcome Text */}
              <VStack {...loginStyles.vstack2}>
                <Text {...loginStyles.text2}>
                  {isAdminMode
                    ? t('login.welcomeToYourAccountAdmin')
                    : t('login.welcomeToYourAccount')}
                </Text>
                <Text {...loginStyles.text3}>{t('login.logInToContinue')}</Text>
              </VStack>

              {/* Email Input */}
              <VStack {...loginStyles.vstack3}>
                <Text {...loginStyles.text4}>{t('login.username')}</Text>
                <Input isDisabled={loading} isInvalid={!!error}>
                  <InputField
                    placeholder="your.email@brac.net"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={handleLoginOnEnter}
                  />
                </Input>
              </VStack>

              {/* Password Input */}
              <VStack {...loginStyles.vstack4}>
                <Text {...loginStyles.text5}>{t('login.password')}</Text>
                <Box position="relative">
                  <Input isDisabled={loading} isInvalid={!!error}>
                    <InputField
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      pr="$12"
                      returnKeyType="done"
                      onSubmitEditing={handleLoginOnEnter}
                    />
                  </Input>
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={loginStyles.eyeIconButton}
                  >
                    <LucideIcon
                      name={showPassword ? 'EyeOff' : 'Eye'}
                      size={20}
                      color="#6B7280"
                    />
                  </Pressable>
                </Box>
              </VStack>

              {/* Remember Me Checkbox - UI hidden but functionality preserved */}
              {/* <HStack {...loginStyles.hstack}>
                <Checkbox
                  value="remember"
                  isChecked={rememberMe}
                  onChange={setRememberMe}
                  aria-label={t('login.rememberMe')}
                >
                  <CheckboxIndicator mr="$2">
                    <CheckboxIcon as={CheckIcon} color="$modalBackground" />
                  </CheckboxIndicator>
                  <CheckboxLabel>{t('login.rememberMe')}</CheckboxLabel>
                </Checkbox>
              </HStack> */}

              {/* Error Message */}
              {error ? (
                <Box {...loginStyles.errorBox}>
                  <Text {...loginStyles.errorText}>{error}</Text>
                </Box>
              ) : null}

              {/* Login Button */}
              <Button
                {...loginStyles.button}
                onPress={handleLogin}
                isDisabled={loading}
                // @ts-ignore - Web-specific event handlers
                onMouseLeave={() => {
                  hoverLoginTriggered.current = false;
                }}
              >
                {loading ? (
                  <Spinner color="$white" />
                ) : (
                  <ButtonText {...loginStyles.buttonText}>
                    {isAdminMode ? t('login.adminLogin') : t('login.lcLogin')}
                  </ButtonText>
                )}
              </Button>

              <Button
                variant="link"
                onPress={() => navigation.navigate('forgot-password' as never)}
                isDisabled={loading}
              >
                <ButtonText {...loginStyles.adminLinkText}>
                  {t('login.forgotPassword')}
                </ButtonText>
              </Button>
              
              {/* Admin Login Link / Cancel Link */}
              {!isAdminMode ? (
                <Button
                  variant="link"
                  onPress={handleAdminLoginClick}
                  isDisabled={loading}
                >
                  <ButtonText {...loginStyles.adminLinkText}>
                    {t('login.adminLogin')}
                  </ButtonText>
                </Button>
              ) : (
                <Button
                  variant="link"
                  onPress={handleCancelAdminMode}
                  isDisabled={loading}
                >
                  <ButtonText {...loginStyles.adminLinkText}>
                    {t('login.backToLogin') || 'Back to LC / LF Login'}
                  </ButtonText>
                </Button>
              )}

              {/* Helper Text */}
              {/* <VStack {...loginStyles.vstack5}>
                  <Text {...loginStyles.text6}>{t('login.testAccounts')}</Text>
                  <Text {...loginStyles.text7}>
                    {t('login.testAccountsCredentials')}
                  </Text>
                </VStack> */}
            </VStack>
          </Animated.View>
        </Box>
      </Box>
    </ScrollView>
  );
};

export default LoginScreen;
