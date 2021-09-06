module.exports = {
    target: "web",
    entry: [
        "whatwg-fetch",
        'webpack-dev-server/client',
        'webpack/hot/only-dev-server',
        'babel-polyfill',
        "./src/index.js"
        ],
    output: {
        path: __dirname + 'build',
        publicPath: '/',
        filename: "bundle.js"
    },
    plugins: [new HtmlWebpackPlugin({
        template: "index.html"
    }),
    new CompressionPlugin({
        asset: "[path].gz[query]",
        algorithm: "gzip",
        test: /\.js$|\.jsx$|\.css$|\.html$/,
        threshold: 10240,
        minRatio: 0.8
    }),
    new webpack.HotModuleReplacementPlugin(),
    // enable HMR globally

    new webpack.NoEmitOnErrorsPlugin()
    ],
    module: {
        rules: [
            {
                //tell webpack to use jsx-loader for all *.jsx files
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader"
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {}
                  }
                ]
            },
            {
                test: /\.(eot|ttf)$/,
                loader: "file-loader",
            },
            {
                test: /\.scss$/,
                loaders: ["style-loader", "css-loader", "sass-loader"]
            }
        ]
    },
    resolve: {
        modules: [
            path.resolve("./src"),
            path.resolve("./node_modules")
        ],
        extensions: [".js", ".jsx"]
    },
    devServer: {
        watchOptions: {
        // Needed for Windows Subsystem for Linux dev environment:
            poll: true
        },
        contentBase: './build'
    },
    devtool: "cheap-module-eval-source-map",
    node: {
        child_process : "empty",
        fs: "empty"
    }
};