const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env = {}, argv = {}) => {
  // Webpack passes mode via argv.mode when using --mode flag
  const mode = argv.mode || env.mode || process.env.NODE_ENV || 'development';
  const isProduction = mode === 'production';

  return {
    entry: {
      main: ['./src/web-component/registerComponent.tsx'],
    },
    output: {
      path: path.resolve(__dirname, 'project-player-dist'),
      filename: '[name].js', // Always use main.js (no contenthash)
      publicPath: '/',
      clean: true, // Clean output directory before build
      // Provide global variables for CommonJS compatibility
      globalObject: 'this',
    },
    mode,
    devtool: false, // Disable source maps to avoid generating .map files
    // Enable tree-shaking
    optimization: {
      minimize: isProduction,
      // Use webpack's default minimizer (TerserPlugin is built-in)
      minimizer: isProduction
        ? [
            '...', // Use default minimizers
          ]
        : [],
      usedExports: true, // Enable tree-shaking
      sideEffects: false, // Assume no side effects for better tree-shaking
      moduleIds: isProduction ? 'deterministic' : 'named',
      chunkIds: isProduction ? 'deterministic' : 'named',
      // Disable code splitting - bundle everything into a single file
      splitChunks: false,
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          // Only include necessary node_modules - exclude React Native specific ones
          // Also exclude output directories to prevent processing built files
          exclude: [
            /node_modules\/(?!(@gluestack-ui|@gluestack-style|@expo|react-to-webcomponent|react|react-dom|react-native-svg|react-i18next|i18next))/,
            // Exclude React Native modules
            /react-native/,
            /@react-navigation/,
            /react-native-reanimated/,
            /react-native-safe-area-context/,
            /react-native-gesture-handler/,
            /react-native-screens/,
            /react-native-webview/,
            /react-native-image-picker/,
            /@react-native-async-storage/,
            /@react-native-community/,
            // Exclude output directories
            /project-player-dist/,
            /dist/,
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    modules: false, // Preserve ES modules for tree-shaking
                  },
                ],
                '@babel/preset-react',
                '@babel/preset-typescript',
              ],
              plugins: ['react-native-web'],
              cacheDirectory: true, // Enable babel caching
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[contenthash:8].[ext]',
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
        '@ui': path.resolve(__dirname, 'src/components/ui'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@contexts': path.resolve(__dirname, 'src/contexts'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@constants': path.resolve(__dirname, 'src/constants'),
        '@layout': path.resolve(__dirname, 'src/layout'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
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
      // Exclude output directory from module resolution
      modules: ['node_modules', path.resolve(__dirname, 'src')],
      // Fallback for Node.js modules
      fallback: {
        'process/browser': false, // Let webpack handle process polyfill via ProvidePlugin
      },
    },
    // Configure Node.js polyfills
    node: {
      global: true,
      __filename: false,
      __dirname: false,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/project-player-index.html',
        inject: 'body', // Inject scripts at the end of body
        scriptLoading: 'blocking',
        // Add CommonJS polyfill before main bundle
        templateParameters: {
          commonjsPolyfill: `
<script>
(function(global) {
  if (typeof global.exports === 'undefined') global.exports = {};
  if (typeof global.module === 'undefined') global.module = { exports: global.exports };
  if (typeof exports === 'undefined') var exports = global.exports;
  if (typeof module === 'undefined') var module = global.module;
  if (typeof window !== 'undefined') {
    window.exports = global.exports;
    window.module = global.module;
  }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
</script>
          `,
        },
        minify: isProduction
          ? {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: false, // Don't minify the polyfill script
              minifyCSS: true,
              minifyURLs: true,
            }
          : false,
      }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProduction),
        'process.env.NODE_ENV': JSON.stringify(mode),
        global: 'globalThis',
      }),
      // Ignore native-only modules entirely - these are not needed for web component
      new webpack.IgnorePlugin({
        resourceRegExp:
          /^react-native-(gesture-handler|screens|webview|image-picker|reanimated)$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-navigation/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-community/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^react-native-safe-area-context$/,
      }),
      // Replace AsyncStorage with a web-compatible mock (uses IndexedDB in web component)
      new webpack.NormalModuleReplacementPlugin(
        /@react-native-async-storage\/async-storage/,
        path.resolve(__dirname, 'src/mocks/asyncStorage.web.js'),
      ),
      // Provide fallbacks for Node.js modules
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ],
    // Exclude large dependencies from bundle if not needed
    externals: isProduction
      ? {
          // You can add externals here if you want to load them from CDN
          // 'react': 'React',
          // 'react-dom': 'ReactDOM',
        }
      : {},
    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000, // 500KB
      maxAssetSize: 512000, // 500KB
    },
  };
};
