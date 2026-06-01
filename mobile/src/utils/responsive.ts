import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions from a standard phone (e.g., iPhone 11/12/13 Pro)
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

/**
 * Scales a size based on the screen's width.
 * Useful for horizontal dimensions (width, paddingHorizontal, marginHorizontal).
 */
export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scales a size based on the screen's height.
 * Useful for vertical dimensions (height, paddingVertical, marginVertical).
 */
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderately scales a size. Useful when you don't want a dimension to grow/shrink linearly,
 * often used for font sizes and border radii.
 * @param factor controls how much it scales (default 0.5)
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Scales a size vertically but moderately.
 */
export const moderateVerticalScale = (size: number, factor = 0.5) => size + (verticalScale(size) - size) * factor;

// Common Helpers
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Determine if the device is a tablet
export const isTablet = () => {
  let pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  } else if (pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)) {
    return true;
  }
  
  // A simple fallback for layout logic
  return SCREEN_WIDTH >= 768;
};

// Check if device is currently in landscape
export const isLandscape = () => {
  const dim = Dimensions.get('screen');
  return dim.width >= dim.height;
};
