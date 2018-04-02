const path = require("path");
const { DefinePlugin } = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { AngularCompilerPlugin } = require("@ngtools/webpack");

module.exports = function(env = {}) {
    const mode = env.prod ? "production" : "development";
    const plugins = [
        new DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(mode),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY),
                OWM_API_KEY: JSON.stringify(process.env.OWM_API_KEY),
                PROXY_URL: JSON.stringify(process.env.PROXY_URL)
            }
        }),
        new MiniCssExtractPlugin({
            filename: "main.css"
        }),
        new HtmlWebpackPlugin({
            "template": "./src/index.html"
        }),
        new AngularCompilerPlugin({
            mainPath: "./src/main.ts",
            tsConfigPath: "./tsconfig.json",
            skipCodeGeneration: true
        })
    ];

    if (env.prod) {
        plugins.push(
            new UglifyJsPlugin({
                uglifyOptions: {
                    ecma: 8
                }
            })
        );
    }

    return {
        mode,
        entry: {
            main: "./src/main.ts"
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js"
        },
        resolve: {
            extensions: [
                ".ts",
                ".js"
            ],
            modules: [
                path.resolve(__dirname, "node_modules"),
                path.resolve(__dirname, "src")
            ]
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
            }
        },
        module: {
            rules: [
                {
                    test: /\.s?css$/,
                    loaders: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: !env.prod,
                                url: false,
                                minimize: env.prod
                            }
                        },
                        {
                            loader: "postcss-loader",
                            options: {
                                sourceMap: !env.prod,
                                plugins: () => [require("autoprefixer")()]
                            }
                        },
                        {
                            loader: "sass-loader",
                            options: {
                                sourceMap: !env.prod
                            }
                        }
                    ]
                },
                {
                    "test": /\.html$/,
                    "loader": "raw-loader"
                },
                {
                    "test": /\.ts$/,
                    "loader": "@ngtools/webpack"
                }
            ]
        },
        devtool: env.prod ? false : "inline-source-map",
        plugins,
        stats: {
            entrypoints: false,
            children: false
        }
    };
};
