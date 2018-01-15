const path = require("path");
const { DefinePlugin, NoEmitOnErrorsPlugin, NamedModulesPlugin, optimize } = require("webpack");
const { ModuleConcatenationPlugin, CommonsChunkPlugin } = optimize;
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const { AotPlugin } = require("@ngtools/webpack");

module.exports = function(env = {}) {
    const nodeModules = path.join(process.cwd(), "node_modules");
    const genDirNodeModules = path.join(process.cwd(), "src", "$$_gendir", "node_modules");
    const entryPoints = ["polyfills", "vendor", "main"];
    const plugins = [
        new NoEmitOnErrorsPlugin(),
        new DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production"),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY),
                OWM_API_KEY: JSON.stringify(process.env.OWM_API_KEY),
                TWITTER_API_KEYS: JSON.stringify(process.env.TWITTER_API_KEYS)
            }
        }),
        new HtmlWebpackPlugin({
            "template": "./src/index.html",
            "hash": false,
            "inject": true,
            "compile": true,
            "favicon": false,
            "minify": false,
            "cache": true,
            "showErrors": true,
            "chunks": "all",
            "xhtml": true,
            "chunksSortMode": function sort(left, right) {
                const leftIndex = entryPoints.indexOf(left.names[0]);
                const rightindex = entryPoints.indexOf(right.names[0]);

                if (leftIndex > rightindex) {
                    return 1;
                }
                else if (leftIndex < rightindex) {
                    return -1;
                }
                return 0;
            }
        }),
        new ExtractTextPlugin("main.css"),
        new CommonsChunkPlugin({
            "name": [
                "vendor"
            ],
            "minChunks": (module) => module.resource &&
                    (module.resource.startsWith(nodeModules) || module.resource.startsWith(genDirNodeModules)),
            "chunks": [
                "main"
            ]
        }),
        new NamedModulesPlugin({}),
        new AotPlugin({
          "mainPath": "./src/main.ts",
          "hostReplacementPaths": {},
          "exclude": [],
          "tsConfigPath": "./tsconfig.json",
          "skipCodeGeneration": true
        })
    ];

    if (env.prod) {
        plugins.push(
            new ModuleConcatenationPlugin(),
            new UglifyJsPlugin({
                uglifyOptions: {
                    ecma: 8
                }
            })
        );
    }

    return {
        "entry": {
          "main": "./src/main.ts",
          "polyfills": "./src/polyfills.ts"
        },
        "output": {
            "path": path.join(process.cwd(), "dist"),
            "filename": "[name].js",
            "chunkFilename": "[id].chunk.js"
        },
        "resolve": {
            "extensions": [
                ".ts",
                ".js"
            ],
            "modules": [
                "./node_modules"
            ]
        },
        "resolveLoader": {
          "modules": [
            "./node_modules"
          ]
        },
        module: {
            rules: [
                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: [{
                            loader: "css-loader",
                            options: {
                                sourceMap: !env.prod
                            }
                        }, {
                            loader: "postcss-loader",
                            options: {
                                sourceMap: !env.prod,
                                plugins: () => {
                                    const plugins = [require("autoprefixer")()];

                                    if (env.prod) {
                                        plugins.push(require("cssnano")());
                                    }
                                    return plugins;
                                }
                            }
                        }, {
                            loader: "sass-loader",
                            options: {
                                sourceMap: !env.prod
                            }
                        }]
                    })
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
        plugins
    };
};
