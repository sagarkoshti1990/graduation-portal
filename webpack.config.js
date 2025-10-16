const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './index.web.js',
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
      serveIndex: true,
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'https://qa-lap.prathamdigital.org',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
      },
      {
        context: ['/assets'],
        target: 'https://qa-lap.prathamdigital.org',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onProxyReq: function (proxyReq, req, res) {
          // Set proper headers for the proxied request
          proxyReq.setHeader('Accept', '*/*');
          proxyReq.removeHeader('origin');
          proxyReq.removeHeader('referer');
        },
        bypass: function (req, res, proxyOptions) {
          // Always proxy /assets requests, don't serve from static
          console.log('Proxying asset request:', req.url);
          return null;
        },
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude:
          /node_modules\/(?!(@react-navigation|react-native-reanimated|@gluestack-ui|@gluestack-style|@gluestack|@expo))/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: ['react-native-web'],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/images/',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      // Mock native modules that don't work on web
      'react-native-image-picker': path.resolve(
        __dirname,
        'src/mocks/imagePicker.js',
      ),
      'react-native-reanimated': path.resolve(
        __dirname,
        'src/mocks/reanimated',
      ),
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true,
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
};
