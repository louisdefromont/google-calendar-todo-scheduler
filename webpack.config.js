const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                include: [path.resolve(__dirname, 'src')]
            },
            {
                test: /\.css$/,
                use: 'css-loader'
            },
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }
        ],
    },
    resolve: {
        extensions: ['.tsc', '.ts', '.js']
    },
    output: {
        publicPath: 'auto',
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public'),
    }
};