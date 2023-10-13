const path = require("path");
const { DefinePlugin } = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const postcssPresetEnv = require("postcss-preset-env");

module.exports = function(env = {}) {
  const mode = env.prod ? "production" : "development";
  const plugins = [
    new DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(mode),
        UNSPLASH_KEY: JSON.stringify(process.env.UNSPLASH_KEY),
        SERVER_URL: JSON.stringify(process.env.SERVER_URL),
        DEV_SERVER_URL: JSON.stringify(process.env.DEV_SERVER_URL)
      }
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css"
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      minify: env.prod ? {
        keepClosingSlash: true,
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
        minifyCSS: true
      } : undefined
    }),
    new CopyPlugin({ patterns: [
      { from: "./src/assets", to: "./assets" },
      { from: "./public", globOptions: {
        ignore: ["**/index.html"]
      }}
    ]})
  ];

  return {
    mode,
    target: "browserslist",
    entry: {
      main: "./src/index.jsx"
    },
    resolve: {
      extensions: [".jsx", ".js"],
      alias: {
        components: path.resolve(__dirname, "src/components"),
        contexts: path.resolve(__dirname, "src/contexts"),
        services: path.resolve(__dirname, "src/services"),
        assets: path.resolve(__dirname, "src/assets"),
        utils$: path.resolve(__dirname, "src/utils.js")
      }
    },
    output: {
      path: path.resolve(__dirname, "./dist"),
      filename: "[name].js"
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /node_modules/,
            name: "vendor",
            chunks: "initial"
          }
        }
      },
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            ecma: 2021,
            output: {
              comments: false
            }
          }
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              "default",
              { discardComments: { removeAll: true } }
            ]
          }
        })
      ]
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: true
              }
            },
            {
              loader: "css-loader",
              options: {
                esModule: true,
                importLoaders: 1,
                url: false
              }
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [
                    "postcss-import",
                    require("postcss-mixins"),
                    postcssPresetEnv({ stage: 0 })
                  ]
                }
              }
            }
          ]
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env", {
                modules: false,
                loose: true,
                bugfixes: true,
                useBuiltIns: "usage",
                corejs: 3
              }], ["@babel/preset-react", {
                runtime: "automatic"
              }]],
              plugins: ["@babel/plugin-syntax-import-attributes"]
            }
          }
        }
      ]
    },
    plugins,
    devtool: env.prod ? false : "inline-source-map",
    stats: {
      entrypoints: false,
      warnings:false,
      children: false
    }
  };
};
