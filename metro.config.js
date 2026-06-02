const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);
const {
  assetExts,
  sourceExts,
} = defaultConfig.resolver;
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve(
      'react-native-svg-transformer'
    ),
  },
  resolver: {
    assetExts: assetExts.filter(
      ext => ext !== 'svg'
    ),

    sourceExts: [...sourceExts, 'svg'],

    // @react-native-community/netinfo ships TypeScript source as its "react-native"
    // entry point, which Metro cannot resolve (it looks for .js files inside the
    // package's internal imports). Redirect to the pre-compiled CommonJS output.
    extraNodeModules: {
      '@react-native-community/netinfo': path.resolve(
        __dirname,
        'node_modules/@react-native-community/netinfo/lib/commonjs',
      ),
    },

    alias: {
      '@assets': path.resolve(__dirname,'./src/assets'),
      '@ui': path.resolve(__dirname, 'src/components/ui'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@app-types': path.resolve(__dirname, 'src/types'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@layout': path.resolve(__dirname, 'src/layout'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
    },
  },
};
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
