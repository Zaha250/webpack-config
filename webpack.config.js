const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const PrerenderSPAPlugin = require('prerender-spa-plugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const eslintFormatter = require('react-dev-utils/eslintFormatter');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name(module, chunks, cacheGroupKey) {
            const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return `${cacheGroupKey}.${packageName.replace("@", "")}`;
          }
        },
      }
    },
    runtimeChunk: "single"
  }
  if (isProd) {
    config.minimizer = [
      new CssMinimizerWebpackPlugin(),
      new TerserWebpackPlugin({
        terserOptions: {
          compress: {
            comparisons: false
          },
          mangle: {
            safari10: true
          },
          output: {
            comments: false,
            ascii_only: true
          },
          warnings: false
        }
      }),
    ]
  }
  return config
}

const plugins = () => {
  const items = [
    new HtmlWebpackPlugin(
      Object.assign(
        {},
        {
          template: "./index.html",
          filename: "index.html",
          inject: true,
        },
        isProd
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true,
                },
              }
            : undefined
      )
    ),
    new MiniCssExtractPlugin({
      filename: "assets/css/[name].[contenthash:8].css",
      chunkFilename: "assets/css/[name].[contenthash:8].chunk.css"
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/favicon.ico'),
          to: path.resolve(__dirname, 'build')
        }
      ]
    }),
    new CleanWebpackPlugin()
  ]

  if(isProd) {
    items.push(
      new PrerenderSPAPlugin({
        staticDir: path.join(__dirname, 'build'),
        routes: [ '/']
      })
    )
  }

  return items
}

const getStyleLoaders = (cssOptions, preProcessor) => {
  const loaders = [
    isDev && require.resolve('style-loader'),
    isProd && {
      loader: MiniCssExtractPlugin.loader,
      options: {
        publicPath: '../'
      }
    },
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      loader: require.resolve('postcss-loader'),
    },
  ].filter(Boolean);
  if (preProcessor) {
    loaders.push({
      loader: require.resolve(preProcessor),
    });
  }
  return loaders;
};

const imgUse = () => {
  const use = [
    {
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: './images/[name].[hash:8].[ext]'
      }
    }
  ]

  if(isProd) {
    use.push({
      loader: 'image-webpack-loader',
      options: {
        mozjpeg: {
          progressive: true,
        },
        optipng: {
          enabled: false,
        },
        pngquant: {
          quality: [0.85, 0.90],
          speed: 4
        },
        gifsicle: {
          interlaced: false,
        },
        // the webp option will enable WEBP
        webp: {
          quality: 85
        }
      }
    })
  }

  return use;
}

module.exports = {
  context: path.resolve(__dirname, "src"),
  mode: isDev ? "development" : "production",
  entry: ["@babel/polyfill", "./index.js"],
  output: {
    filename: isProd ? 'js/[name].[chunkhash:8].js' : 'js/[name].js',
    path: path.resolve(__dirname, 'build'),
    publicPath: isDev ? '' : './', 
  },
  resolve: {
    extensions: ['.js', '.jsx', '.scss'],
    alias: {
      '@src': path.resolve(__dirname, 'src')
    }
  },
  devtool: isDev ? 'inline-source-map' : false,
  target: isDev ? "web" : "browserslist",
  optimization: optimization(),
  devServer: {
    contentBase: path.join(__dirname, 'build'),
    proxy: {
      '/': {
        target: '',
        changeOrigin: true
      }
    },
    watchContentBase: true,
    hot: isDev,
    historyApiFallback: true,
    open: true,
    port: process.env.PORT || 3000,
    compress: true,
    overlay: {
      errors: true,
      warnings: false
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              envName: isProd ? "production" : "development"
            }
          },
          {
            loader: 'eslint-loader',
            options: {
              enforce: 'pre',
              formatter: eslintFormatter,
            },
          },
        ]
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: getStyleLoaders({
          importLoaders: 1
        }),
        sideEffects: true
      },
      {
        test: /\.module\.css$/, //CSS MODULE
        use: getStyleLoaders({
            importLoaders: 1,
            modules: {
              auto: true,
              getLocalIdent: getCSSModuleLocalIdent
            }
        }),
        sideEffects: true
      },
      {
        test: /\.s[ac]ss$/,
        exclude: /\.module\.(scss|sass)$/,
        use: getStyleLoaders(
          {
            importLoaders: 2
          }, 
          'sass-loader'
        ),
        sideEffects: true
      },
      {
        test: /\.module\.(scss|sass)$/, //SCSS MODULE
        use: getStyleLoaders(
          {
          importLoaders: 2,
          modules: {
            auto: true,
            getLocalIdent: getCSSModuleLocalIdent
          }
          },
          'sass-loader'
        ),
        sideEffects: true
      },
      {
        test: /\.(?:ico|png|svg|jpg|jpeg|gif)$/,
        use: imgUse()
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: 'assets/fonts/[name].[hash:8].[ext]'
            }
          }
        ],
      },
      {
        test: /\.xml$/,
        use: ['xml-loader']
      },
      {
        test: /\.(csv|tsv)$/,
        use: ["csv-loader"]
      }
    ]
  },
  plugins: plugins()

}