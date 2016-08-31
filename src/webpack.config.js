const path = require("path");

module.exports = {
    entry: {
        main: path.resolve( __dirname, "app/main.js")
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
                plugins: ["transform-decorators-legacy"],
                presets: ["latest", "angular2"]
            }
        }]
    }
};
