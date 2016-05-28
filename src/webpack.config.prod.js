const webpack = require("webpack");

module.exports = {
    entry: {
        vendor: "app/vendor.js",
        app: "app/main.js"
    },
    output: {
        path: __dirname + "/js",
        filename: "[name].js"
    },
    resolve: {
        root: __dirname,
        extensions: ["", ".js"]
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: "babel-loader",
            exclude: /node_modules/,
            query: {
                presets: ["es2015", "angular2"],
                plugins: ["transform-decorators-legacy"]
            }
        }]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: ["app", "vendor"]
        })
    ]
};
