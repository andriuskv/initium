const path = require("path");
const { DefinePlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { AngularCompilerPlugin } = require("@ngtools/webpack");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = function(env = {}) {
    const mode = env.prod ? "production" : "development";
    const plugins = [
        new DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(mode),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY),
                UNSPLASH_KEY: JSON.stringify(process.env.UNSPLASH_KEY),
                SERVER_URL: JSON.stringify(process.env.SERVER_URL),
                TEST_SERVER_URL: JSON.stringify(process.env.TEST_SERVER_URL)
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
                collapseInlineTagWhitespace: true
            } : undefined
        }),
        new CopyPlugin({ patterns: [
            { from: "./src/assets", to: "./assets" },
            { from: "./public", globOptions: {
                ignore: ["**/index.html"]
            }}
        ]}),
        new AngularCompilerPlugin({
            basePath: "./src/main.ts",
            tsConfigPath: "./tsconfig.json",
            skipCodeGeneration: true,
            compilerOptions: {
                enableIvy: true,
                fullTemplateTypeCheck: true,
                strictInjectionParameters: true,
                strictTemplates: true,
                preserveWhiteSpace: false,
                allowEmptyCodegenFiles: false
            }
        })
    ];

    return {
        mode,
        target: "browserslist",
        entry: {
            main: "./src/main.ts"
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js"
        },
        resolve: {
            extensions: [".ts", ".js", ".json"],
            mainFields: ["es2015", "browser", "module", "main"],
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
                    ecma: 2020,
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
                    ],
                },
            })]
        },
        module: {
            rules: [
                {
                    test: /\.html$/,
                    use: "raw-loader"
                },
                {
                    test: /\.s?css$/,
                    use: [
                        { loader: "to-string-loader" },
                        { loader: MiniCssExtractPlugin.loader },
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: !env.prod,
                                url: false
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
                    use: "@ngtools/webpack"
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
