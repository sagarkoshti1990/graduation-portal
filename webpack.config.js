const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const fs = require('fs');
const crypto = require('crypto');

/** Same value in DefinePlugin + emitted web-app-version.json for stale-cache detection after deploy */
const webAppBuildId =
  process.env.WEB_BUILD_ID || crypto.randomBytes(8).toString('hex');

class EmitWebAppVersionPlugin {
  constructor(buildId) {
    this.buildId = buildId;
  }

  apply(compiler) {
    const { RawSource } = webpack.sources;
    const pluginName = 'EmitWebAppVersionPlugin';
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          const json = JSON.stringify({
            buildId: this.buildId,
            builtAt: new Date().toISOString(),
          });
          compilation.emitAsset(
            'web-app-version.json',
            new RawSource(json)
          );
        }
      );
    });
  }
}

/**
 * Reads public/service-worker.js (template), replaces the two sentinel comments
 * with the real build ID and the full list of compiled asset URLs, then emits
 * the result as service-worker.js in the output.  Only runs in production so
 * HMR / dev-server behaviour is never affected.
 *
 * Sentinel lines in the template:
 *   const CACHE_NAME = 'gbl-shell-dev';   // __INJECT_CACHE_NAME__
 *   const PRECACHE_URLS = ['/', '/index.html'];  // __INJECT_PRECACHE_URLS__
 */
class InjectPrecachePlugin {
  constructor(buildId, templatePath) {
    this.buildId = buildId;
    this.templatePath = templatePath;
  }

  apply(compiler) {
    const { RawSource } = webpack.sources;
    const pluginName = 'InjectPrecachePlugin';

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          // SUMMARIZE runs after all chunks/assets have been emitted so the
          // full asset list is available.
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        (assets) => {
          // Collect every JS/CSS chunk that the browser needs to run the app.
          // Exclude hot-update files (dev-only, never present in production).
          const precacheUrls = ['/', '/index.html'];
          for (const filename of Object.keys(assets)) {
            if (
              (filename.endsWith('.js') && !filename.includes('.hot-update.')) ||
              filename.endsWith('.css')
            ) {
              precacheUrls.push('/' + filename);
            }
          }

          let template;
          try {
            template = fs.readFileSync(this.templatePath, 'utf8');
          } catch (e) {
            compilation.errors.push(
              new Error(`InjectPrecachePlugin: cannot read template ${this.templatePath}: ${e.message}`),
            );
            return;
          }

          const swContent = template
            // Replace cache name sentinel line
            .replace(
              /const CACHE_NAME\s*=\s*'[^']*';\s*\/\/ __INJECT_CACHE_NAME__/,
              `const CACHE_NAME = 'gbl-shell-${this.buildId}'; // injected`,
            )
            // Replace precache URL array sentinel line
            .replace(
              /const PRECACHE_URLS\s*=\s*\[.*?\];\s*\/\/ __INJECT_PRECACHE_URLS__/,
              `const PRECACHE_URLS = ${JSON.stringify(precacheUrls)}; // injected`,
            );

          compilation.emitAsset('service-worker.js', new RawSource(swContent));
        },
      );
    });
  }
}

module.exports = (env = {}, argv = {}) => {
  const mode = argv.mode || env.mode || process.env.NODE_ENV || 'development';
  const isProduction = mode === 'production';

  // Load .env file manually BEFORE DefinePlugin so variables are available
  const envPath = path.resolve(__dirname, '.env');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
          if (key && value) {
            envVars[key] = value;
          }
        }
      }
    });
  }

  // Merge with system environment variables (system vars take precedence)
  const allEnvVars = { ...envVars, ...process.env };

  // Copy selected public assets into dist (PWA icons, manifest, web-component, etc.)
  class CopyPublicToDistPlugin {
    apply(compiler) {
      compiler.hooks.afterEmit.tap('CopyPublicToDistPlugin', () => {
        const copyRecursiveSync = (src, dest) => {
          const exists = fs.existsSync(src);
          const stats = exists && fs.statSync(src);
          const isDirectory = exists && stats.isDirectory();

          if (isDirectory) {
            if (!fs.existsSync(dest)) {
              fs.mkdirSync(dest, { recursive: true });
            }
            fs.readdirSync(src).forEach((childItemName) => {
              copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName)
              );
            });
          } else if (exists) {
            const destParent = path.dirname(dest);
            if (!fs.existsSync(destParent)) {
              fs.mkdirSync(destParent, { recursive: true });
            }
            fs.copyFileSync(src, dest);
          }
        };

        const distRoot = path.resolve(__dirname, 'dist');
        const jobs = [
          ['public/web-component', 'dist/web-component'],
          ['public/pwa', 'dist/pwa'],
          ['public/help', 'dist/help'],
        ];
        const singleFiles = [
          ['public/manifest.webmanifest', 'dist/manifest.webmanifest'],
          ['public/storage-keys.js', 'dist/storage-keys.js'],
          // service-worker.js is NOT copied here — InjectPrecachePlugin emits
          // it with the full precache manifest injected at build time.
        ];

        try {
          for (const [relSrc, relDest] of jobs) {
            const sourceDir = path.resolve(__dirname, relSrc);
            const destDir = path.resolve(__dirname, relDest);
            if (fs.existsSync(sourceDir)) {
              copyRecursiveSync(sourceDir, destDir);
            }
          }
          for (const [relSrc, relDest] of singleFiles) {
            const sourceFile = path.resolve(__dirname, relSrc);
            const destFile = path.resolve(__dirname, relDest);
            if (fs.existsSync(sourceFile)) {
              copyRecursiveSync(sourceFile, destFile);
            }
          }
          if (fs.existsSync(path.join(distRoot, 'web-component'))) {
            console.log('✓ Copied web-component folder to dist');
          }
          if (fs.existsSync(path.join(distRoot, 'pwa'))) {
            console.log('✓ Copied PWA assets (public/pwa) to dist');
          }
        } catch (error) {
          console.error('Error copying public assets to dist:', error);
        }
      });
    }
  }
  
  return {
    entry: './index.web.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      chunkFilename: isProduction
        ? 'js/[name].[contenthash:8].chunk.js'
        : 'js/[name].chunk.js',
      assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
      publicPath: '/',
      clean: true,
    },
    mode,
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',
    optimization: {
      minimize: isProduction,
      minimizer: isProduction ? ['...'] : [],
      usedExports: true,
      sideEffects: true,
      moduleIds: isProduction ? 'deterministic' : 'named',
      chunkIds: isProduction ? 'deterministic' : 'named',
      splitChunks: isProduction
        ? {
            chunks: 'all',
            minSize: 20000,
            maxInitialRequests: 25,
            maxAsyncRequests: 30,
            cacheGroups: {
              react: {
                name: 'react',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                chunks: 'all',
                priority: 50,
                enforce: true,
              },
              rnw: {
                name: 'rnw',
                test: /[\\/]node_modules[\\/](react-native|react-native-web|react-native-safe-area-context)[\\/]/,
                chunks: 'all',
                priority: 45,
                enforce: true,
              },
              navigation: {
                name: 'navigation',
                test: /[\\/]node_modules[\\/]@react-navigation[\\/]/,
                chunks: 'all',
                priority: 40,
                enforce: true,
              },
              gluestack: {
                name: 'gluestack',
                test: /[\\/]node_modules[\\/](@gluestack-ui|@gluestack-style|@react-aria|@react-stately|@internationalized)[\\/]/,
                chunks: 'all',
                priority: 35,
                enforce: true,
              },
              charts: {
                name: 'charts',
                test: /[\\/]node_modules[\\/](react-native-svg)[\\/]/,
                chunks: 'all',
                priority: 30,
                enforce: true,
              },
              webview: {
                name: 'webview',
                test: /[\\/]node_modules[\\/](react-native-webview)[\\/]/,
                chunks: 'all',
                priority: 30,
                enforce: true,
              },
              common: {
                minChunks: 2,
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
              },
              defaultVendors: {
                test: /[\\/]node_modules[\\/]/,
                chunks: 'all',
                priority: 5,
                reuseExistingChunk: true,
              },
              default: {
                minChunks: 2,
                priority: 1,
                reuseExistingChunk: true,
              },
              styles: {
                name: 'styles',
                test: /\.(css)$/,
                chunks: 'all',
                priority: 60,
                enforce: true,
              },
            },
          }
        : false,
      runtimeChunk: isProduction ? 'single' : false,
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
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
      // Add custom headers for downloadable files
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
        
        devServer.app.use((req, res, next) => {
          // Check if the request is for a PDF or DOCX file
          if (req.url.match(/\.(pdf|docx|doc)$/i)) {
            // Extract filename from URL
            const urlParts = req.url.split('/');
            const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
            
            // Set Content-Disposition header to force download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            // Set proper Content-Type
            if (req.url.endsWith('.pdf')) {
              res.setHeader('Content-Type', 'application/pdf');
            } else if (req.url.endsWith('.docx')) {
              res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            } else if (req.url.endsWith('.doc')) {
              res.setHeader('Content-Type', 'application/msword');
            }
          }
          next();
        });
        
        return middlewares;
      },
    },
    cache: {
      type: 'filesystem',
      buildDependencies: {
        // eslint-disable-next-line no-undef
        config: [__filename],
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude:
            /node_modules\/(?!(@react-navigation|react-native-reanimated|react-native-safe-area-context|@gluestack-ui|@gluestack-style|@expo))/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    modules: false,
                  },
                ],
                '@babel/preset-react',
                '@babel/preset-typescript',
              ],
              plugins: ['react-native-web'],
              cacheDirectory: true,
              cacheCompression: false,
            },
          },
        },
        {
          // Exactly one SVG rule must apply: SVGR for code imports, otherwise file URL.
          oneOf: [
            {
              test: /\.svg$/i,
              issuer: /\.[jt]sx?$/,
              use: [
                {
                  loader: '@svgr/webpack',
                  options: {
                    native: true,
                    typescript: true,
                    memo: true,
                    svgo: true,
                    svgoConfig: {
                      plugins: [
                        {
                          name: 'preset-default',
                          params: {
                            overrides: {
                              removeViewBox: false,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
            {
              test: /\.svg$/i,
              type: 'asset/resource',
              generator: {
                filename: 'assets/images/[name].[contenthash:8][ext]',
              },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif|webp|ico)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[contenthash:8][ext]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[contenthash:8][ext]',
          },
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
        '@react-native-community/netinfo': path.resolve(
          __dirname,
          'src/mocks/netinfo.js',
        ),
        'react-native-reanimated': path.resolve(
          __dirname,
          'src/mocks/reanimated',
        ),
        '@ui': path.resolve(__dirname, 'src/components/ui'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@contexts': path.resolve(__dirname, 'src/contexts'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@app-types': path.resolve(__dirname, 'src/types'),
        '@constants': path.resolve(__dirname, 'src/constants'),
        '@layout': path.resolve(__dirname, 'src/layout'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@assets': path.resolve(__dirname, 'src/assets'),
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
      modules: ['node_modules', path.resolve(__dirname, 'src')],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        inject: true,
        minify: isProduction
          ? {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            }
          : false,
      }),
      new Dotenv({
        path: './.env', // Path to .env file
        safe: false, // Set to true if you want to use .env.example
        systemvars: true, // Load system environment variables
        defaults: false, // Load .env.defaults
      }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProduction),
        'process.env.NODE_ENV': JSON.stringify(mode),
        // Inject environment variables from .env file
        // Use allEnvVars which includes both .env file vars and system vars
        ...getEnvVars(allEnvVars),
        // After .env spread so deploy id always matches emitted web-app-version.json
        'process.env.WEB_APP_BUILD_ID': JSON.stringify(webAppBuildId),
        }),
      // Ignore native-only modules entirely
      new webpack.IgnorePlugin({
        resourceRegExp: /^react-native-(gesture-handler|screens)$/,
      }),
      // Ignore @env module for web builds (it's only available in React Native via babel plugin)
      // The code in env.ts handles this gracefully by catching the require error and falling back to process.env
      new webpack.IgnorePlugin({
        resourceRegExp: /^@env$/,
      }),
      new EmitWebAppVersionPlugin(webAppBuildId),
      new CopyPublicToDistPlugin(),
      // Production only: emit service-worker.js with full precache manifest injected.
      // In development the SW is never registered (localhost unregisters it) so this
      // plugin is a no-op there — InjectPrecachePlugin guards itself with isProduction.
      ...(isProduction
        ? [new InjectPrecachePlugin(webAppBuildId, path.resolve(__dirname, 'public/service-worker.js'))]
        : []),
    ],
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};


const getEnvVars = (allEnvVars) => {
  return Object.keys(allEnvVars).reduce((acc, key) => {
    // Include all variables from .env file and system
    const value = allEnvVars[key];
    if (value !== undefined && value !== null && value !== '') {
      acc[`process.env.${key}`] = JSON.stringify(String(value));
    }
    return acc;
  }, {});
}