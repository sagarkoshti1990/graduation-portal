module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    'react-native-web',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.web.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@ui': './src/components/ui',
          '@components': './src/components',
          '@utils': './src/utils',
          '@config': './src/config',
          '@contexts': './src/contexts',
          '@types': './src/types',
          '@constants': './src/constants',
          '@layout': './src/layout',
          '@hooks': './src/hooks',
        },
      },
    ],
  ],
};
