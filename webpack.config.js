const path = require("path");
const { DefinePlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { AngularCompilerPlugin } = require("@ngtools/webpack");

module.exports = function(env = {}) {
    const mode = env.prod ? "production" : "development";
    const plugins = [
        new DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(mode),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY),
                UNSPLASH_KEY: JSON.stringify(process.env.UNSPLASH_KEY),
                SERVER_URL: JSON.stringify(process.env.SERVER_URL)
            }
        }),
        new MiniCssExtractPlugin({
            filename: "main.css"
        }),
        new HtmlWebpackPlugin({
            "template": "./src/index.html"
        }),
        new AngularCompilerPlugin({
            basePath: "./src/main.ts",
            tsConfigPath: "./tsconfig.json",
            skipCodeGeneration: true,
            compilerOptions: {
                preserveWhiteSpace: false,
                allowEmptyCodegenFiles: false
            }
        })
    ];

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
            },
            minimizer: [new TerserPlugin({
                terserOptions: {
                    ecma: 8,
                    output: {
                        comments: false
                    }
                }
            })]
        },
        module: {
            rules: [
                {
                    test: /\.s?css$/,
                    loaders: [
                        "to-string-loader",
                        MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: !env.prod,
                                url: false
                            }
                        },
                        {
                            loader: "postcss-loader",
                            options: {
                                sourceMap: !env.prod,
                                plugins() {
                                    const plugins = [require("autoprefixer")()];

                                    if (env.prod) {
                                        plugins.push(require("cssnano")());
                                    }
                                    return plugins;
                                }
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
                    test: /\.ts$/,
                    loader: "@ngtools/webpack"
                }
            ]
        },
        devtool: env.prod ? false : "inline-source-map",
        plugins,
        stats: {
            entrypoints: false,
            warnings: false,
            children: false
        }
    };
};
