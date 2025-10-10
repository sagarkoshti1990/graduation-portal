import { I18nManager, Platform } from 'react-native';

/**
 * Utility functions for RTL-aware styling
 */

/**
 * Get the current RTL status
 */
export const isRTL = (): boolean => {
  if (Platform.OS === 'web') {
    return document.documentElement.dir === 'rtl';
  }
  return I18nManager.isRTL;
};

/**
 * Get direction-aware margin/padding values
 * Usage: getDirectionalStyle('marginStart', 10) returns { marginLeft: 10 } for LTR, { marginRight: 10 } for RTL
 */
export const getDirectionalStyle = (
  property: 'marginStart' | 'marginEnd' | 'paddingStart' | 'paddingEnd',
  value: number | string
): object => {
  const rtl = isRTL();
  const isStart = property.includes('Start');
  const isMargin = property.includes('margin');

  if (Platform.OS === 'web') {
    // For web, use CSS logical properties
    return { [property]: value };
  }

  // For React Native
  const direction = rtl ? (isStart ? 'Right' : 'Left') : (isStart ? 'Left' : 'Right');
  const propertyName = isMargin ? `margin${direction}` : `padding${direction}`;
  return { [propertyName]: value };
};

/**
 * Get RTL-aware flex direction
 */
export const getFlexDirection = (direction: 'row' | 'row-reverse' | 'column' | 'column-reverse'): any => {
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
export const getTextAlign = (align: 'left' | 'right' | 'center' | 'auto'): 'left' | 'right' | 'center' | 'auto' => {
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
export const createRTLStyle = (styles: any): any => {
  const rtl = isRTL();
  const newStyles: any = { ...styles };

  // Convert marginStart/End
  if (styles.marginStart !== undefined) {
    newStyles[rtl ? 'marginRight' : 'marginLeft'] = styles.marginStart;
    delete newStyles.marginStart;
  }
  if (styles.marginEnd !== undefined) {
    newStyles[rtl ? 'marginLeft' : 'marginRight'] = styles.marginEnd;
    delete newStyles.marginEnd;
  }

  // Convert paddingStart/End
  if (styles.paddingStart !== undefined) {
    newStyles[rtl ? 'paddingRight' : 'paddingLeft'] = styles.paddingStart;
    delete newStyles.paddingStart;
  }
  if (styles.paddingEnd !== undefined) {
    newStyles[rtl ? 'paddingLeft' : 'paddingRight'] = styles.paddingEnd;
    delete newStyles.paddingEnd;
  }

  // Convert left/right
  if (styles.left !== undefined) {
    newStyles[rtl ? 'right' : 'left'] = styles.left;
    if (rtl) delete newStyles.left;
  }
  if (styles.right !== undefined) {
    newStyles[rtl ? 'left' : 'right'] = styles.right;
    if (rtl) delete newStyles.right;
  }

  // Convert text alignment
  if (styles.textAlign === 'left') {
    newStyles.textAlign = rtl ? 'right' : 'left';
  } else if (styles.textAlign === 'right') {
    newStyles.textAlign = rtl ? 'left' : 'right';
  }

  // Convert flex direction for rows
  if (styles.flexDirection === 'row') {
    newStyles.flexDirection = rtl ? 'row-reverse' : 'row';
  } else if (styles.flexDirection === 'row-reverse') {
    newStyles.flexDirection = rtl ? 'row' : 'row-reverse';
  }

  return newStyles;
};

/**
 * A StyleSheet creator that applies RTL transformations
 */
export const createRTLStyleSheet = (styles: { [key: string]: any }): { [key: string]: any } => {
  const rtlStyles: { [key: string]: any } = {};
  
  for (const key in styles) {
    rtlStyles[key] = createRTLStyle(styles[key]);
  }
  
  return rtlStyles;
};

/**
 * Flip horizontal position for RTL
 */
export const flipPosition = (position: number, containerWidth: number): number => {
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

