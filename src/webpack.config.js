const webpack = require("webpack");
const path = require("path");

module.exports = function(env = {}) {
    const plugins = [
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)@angular/,
            path.resolve(__dirname, "../src")
        ),
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production"),
                DROPBOX_API_KEY: JSON.stringify(process.env.DROPBOX_API_KEY),
                OWM_API_KEY: JSON.stringify(process.env.OWM_API_KEY),
                TWITTER_API_KEYS: JSON.stringify(process.env.TWITTER_API_KEYS)
            }
        })
    ];

    if (env.prod) {
        plugins.push(
            new webpack.optimize.UglifyJsPlugin({
                comments: false,
                compress: {
                    warnings: false,
                    unused: true,
                    dead_code: true,
                    screw_ie8: true,
                    conditionals: true,
                    evaluate: true,
                    unsafe: true,
                    drop_console: true,
                    comparisons: true,
                    sequences: true
                }
            })
        );
    }

    return {
        entry: {
            main: "./src/app/main.js"
        },
        output: {
            path: path.resolve(__dirname, "../dist/js"),
            filename: "[name].js"
        },
        resolve: {
            modules: [path.resolve("src/app"), "node_modules"],
            alias: {
                Services: path.resolve(__dirname, "app/services/")
            }
        },
        module: {
            rules: [{
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                options: {
                    presets: [["env", {
                        modules: false,
                        useBuiltIns: true,
                        targets: {
                            browsers: ["last 2 versions", "Chrome >= 47"]
                        }
                    }], "angular2"]
                }
            }]
        },
        devtool: env.prod ? false : "inline-source-map",
        plugins
    };
};
