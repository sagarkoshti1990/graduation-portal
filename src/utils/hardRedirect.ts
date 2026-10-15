import { Linking, Platform } from 'react-native';
import logger from './logger';
import { resolveExternalLink } from './openExternalLink';

// Unlike openExternalLink (opens in a new tab/external app), this replaces
// the current page/tab — use for destinations that should take over navigation.
const hardRedirect = async (url: string) => {
  const resolvedUrl = resolveExternalLink(url);

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = resolvedUrl;
      return;
    }

    const canOpen = await Linking.canOpenURL(resolvedUrl);
    if (!canOpen) {
      logger.warn(`Unable to open redirect URL: ${resolvedUrl}`);
      return;
    }

    await Linking.openURL(resolvedUrl);
  } catch (error) {
    logger.warn('Failed to perform hard redirect', error);
  }
};

export default hardRedirect;
