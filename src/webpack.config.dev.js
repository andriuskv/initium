const webpack = require("webpack");
const path = require("path");

module.exports = {
    entry: {
        vendor: path.resolve( __dirname, "app/vendor.js"),
        app: path.resolve( __dirname, "app/main.js")
    },
    output: {
        path: __dirname + "/js",
        filename: "[name].js"
    },
    resolve: {
        extensions: ["", ".js"],
        modules: [path.resolve(__dirname, "app"), "node_modules"]
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: "babel-loader",
            exclude: /node_modules/,
            query: {
                presets: ["es2015-webpack", "angular2"],
                plugins: ["transform-decorators-legacy"]
            }
        }]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: ["app", "vendor"]
        })
    ],
    devtool: "inline-source-map"
};
