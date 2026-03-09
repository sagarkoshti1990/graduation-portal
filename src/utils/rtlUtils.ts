import { I18nManager } from 'react-native';
import { isWeb } from '@utils/platform';

/**
 * Utility functions for RTL-aware styling
 */

/**
 * Get the current RTL status
 */
export const isRTL = (): boolean => {
  if (isWeb) {
    if (typeof document !== 'undefined') {
      return document.documentElement.dir === 'rtl';
    }
    return false;
  }
  return I18nManager.isRTL;
};

/**
 * Get direction-aware margin/padding values
 * Usage: getDirectionalStyle('marginStart', 10) returns { marginLeft: 10 } for LTR, { marginRight: 10 } for RTL
 */
export const getDirectionalStyle = (
  property: 'marginStart' | 'marginEnd' | 'paddingStart' | 'paddingEnd',
  value: number | string,
): object => {
  const rtl = isRTL();
  const isStart = property.includes('Start');
  const isMargin = property.includes('margin');

  if (isWeb) {
    // For web, use CSS logical properties
    return { [property]: value };
  }

  // For React Native
  const direction = rtl
    ? isStart
      ? 'Right'
      : 'Left'
    : isStart
    ? 'Left'
    : 'Right';
  const propertyName = isMargin ? `margin${direction}` : `padding${direction}`;
  return { [propertyName]: value };
};

/**
 * Get RTL-aware flex direction
 */
export const getFlexDirection = (
  direction: 'row' | 'row-reverse' | 'column' | 'column-reverse',
): 'row' | 'row-reverse' | 'column' | 'column-reverse' => {
  if (direction === 'row' || direction === 'row-reverse') {
    const rtl = isRTL();
    if (rtl) {
      return direction === 'row' ? 'row-reverse' : 'row';
    }
  }
  return direction;
};

/**
 * Get RTL-aware text alignment
 */
export const getTextAlign = (
  align: 'left' | 'right' | 'center' | 'auto',
): 'left' | 'right' | 'center' | 'auto' => {
  if (align === 'left' || align === 'right') {
    const rtl = isRTL();
    if (rtl) {
      return align === 'left' ? 'right' : 'left';
    }
  }
  return align;
};

/**
 * Get RTL-aware transform for icons/images that should flip
 */
export const getFlipTransform = (shouldFlip: boolean = true): object[] => {
  const rtl = isRTL();
  if (rtl && shouldFlip) {
    return [{ scaleX: -1 }];
  }
  return [];
};

/**
 * Create RTL-aware styles
 * This function converts logical properties to physical ones based on RTL direction
 */
export const createRTLStyle = (styles: Record<string, unknown>): Record<string, unknown> => {
  const rtl = isRTL();
  const newStyles: Record<string, unknown> = { ...styles };

  // Convert marginStart/End
  if (styles.marginStart !== undefined) {
    newStyles[rtl ? 'marginRight' : 'marginLeft'] = styles.marginStart as string | number;
    delete newStyles.marginStart;
  }
  if (styles.marginEnd !== undefined) {
    newStyles[rtl ? 'marginLeft' : 'marginRight'] = styles.marginEnd as string | number;
    delete newStyles.marginEnd;
  }

  // Convert paddingStart/End
  if (styles.paddingStart !== undefined) {
    newStyles[rtl ? 'paddingRight' : 'paddingLeft'] = styles.paddingStart as string | number;
    delete newStyles.paddingStart;
  }
  if (styles.paddingEnd !== undefined) {
    newStyles[rtl ? 'paddingLeft' : 'paddingRight'] = styles.paddingEnd as string | number;
    delete newStyles.paddingEnd;
  }

  // Convert left/right
  if (styles.left !== undefined) {
    newStyles[rtl ? 'right' : 'left'] = styles.left as string | number;
    if (rtl) delete newStyles.left;
  }
  if (styles.right !== undefined) {
    newStyles[rtl ? 'left' : 'right'] = styles.right as string | number;
    if (rtl) delete newStyles.right;
  }

  // Convert text alignment
  if (styles.textAlign === 'left' || styles.textAlign === 'right') {
    newStyles.textAlign = (rtl ? (styles.textAlign === 'left' ? 'right' : 'left') : styles.textAlign) as string;
  }

  if (styles.flexDirection === 'row' || styles.flexDirection === 'row-reverse') {
    newStyles.flexDirection = (rtl ? (styles.flexDirection === 'row' ? 'row-reverse' : 'row') : styles.flexDirection) as string;
  }

  return newStyles;
};

/**
 * A StyleSheet creator that applies RTL transformations
 */
export const createRTLStyleSheet = (styles: Record<string, Record<string, unknown>>): Record<string, Record<string, unknown>> => {
  const rtlStyles: Record<string, Record<string, unknown>> = {};

  for (const key in styles) {
    rtlStyles[key] = createRTLStyle(styles[key]) as Record<string, unknown>;
  }

  return rtlStyles;
};

/**
 * Flip horizontal position for RTL
 */
export const flipPosition = (
  position: number,
  containerWidth: number,
): number => {
  return isRTL() ? containerWidth - position : position;
};

/**
 * Get writing direction
 */
export const getWritingDirection = (): 'ltr' | 'rtl' => {
  return isRTL() ? 'rtl' : 'ltr';
};

export default {
  isRTL,
  getDirectionalStyle,
  getFlexDirection,
  getTextAlign,
  getFlipTransform,
  createRTLStyle,
  createRTLStyleSheet,
  flipPosition,
  getWritingDirection,
};
