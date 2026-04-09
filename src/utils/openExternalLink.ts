import { Linking, Platform } from 'react-native';
import logger from './logger';

declare const process:
  | {
      env?: {
        [key: string]: string | undefined;
      };
    }
  | undefined;

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

const resolveExternalLink = (href: string) => {
  if (ABSOLUTE_URL_PATTERN.test(href)) {
    return href;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(href, window.location.origin).toString();
  }

  const origin = process?.env?.ORIGIN || process?.env?.API_BASE_URL;
  if (!origin) {
    return href;
  }

  return new URL(href, origin).toString();
};

const openExternalLink = async (href: string) => {
  const resolvedHref = resolveExternalLink(href);

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(resolvedHref, '_blank', 'noopener,noreferrer');
      return;
    }

    const canOpen = await Linking.canOpenURL(resolvedHref);
    if (!canOpen) {
      logger.warn(`Unable to open external link: ${resolvedHref}`);
      return;
    }

    await Linking.openURL(resolvedHref);
  } catch (error) {
    logger.warn('Failed to open external link', error);
  }
};

export default openExternalLink;
