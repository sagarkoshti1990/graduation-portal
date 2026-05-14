module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    "@babel/plugin-transform-class-static-block",
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json', '.svg'],
        alias: {
          '@ui': './src/components/ui',
          '@components': './src/components',
          '@utils': './src/utils',
          '@config': './src/config',
          '@contexts': './src/contexts',
          '@app-types': './src/types',
          '@types': './src/types',
          '@constants': './src/constants',
          '@layout': './src/layout',
          '@hooks': './src/hooks',
          '@assets': './src/assets',
        },
      },
    ],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
      },
    ],
  ],
};
