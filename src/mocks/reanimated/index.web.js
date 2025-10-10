// Mock for react-native-reanimated on web
// This provides stub implementations for web builds

const Reanimated = {
  // Math operations (required for legacy check)
  abs: Math.abs,
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,

  // Animated values
  Value: class Value {
    constructor(value) {
      this._value = value;
    }
  },

  // Hooks
  useSharedValue: initialValue => ({ value: initialValue }),
  useAnimatedStyle: callback => callback(),
  useAnimatedGestureHandler: handlers => handlers,
  useAnimatedScrollHandler: handler => handler,
  useDerivedValue: callback => ({ value: callback() }),
  useAnimatedProps: callback => callback(),
  useAnimatedRef: () => ({ current: null }),

  // Animation functions
  withTiming: (toValue, config, callback) => toValue,
  withSpring: (toValue, config, callback) => toValue,
  withDecay: (config, callback) => 0,
  withDelay: (delay, animation) => animation,
  withSequence: (...animations) => animations[animations.length - 1],
  withRepeat: (animation, numberOfReps, reverse, callback) => animation,

  // Easing functions
  Easing: {
    linear: t => t,
    ease: t => t,
    quad: t => t * t,
    cubic: t => t * t * t,
    bezier: () => t => t,
    in: easing => easing,
    out: easing => easing,
    inOut: easing => easing,
  },

  // Other utilities
  runOnJS: fn => fn,
  runOnUI: fn => fn,
  cancelAnimation: () => {},

  // View components
  createAnimatedComponent: Component => Component,
};

// Export default and named exports
module.exports = Reanimated;
module.exports.default = Reanimated;

// Export commonly used items
Object.keys(Reanimated).forEach(key => {
  module.exports[key] = Reanimated[key];
});
