const path = require('path');
const common = require('./webpack.common');
const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');  // Import webpack

module.exports = merge(common, {
  mode: 'development',
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    fallback: {
      fs: false,  // Disable fs module, not needed in browser
      process: require.resolve('process/browser'),  // Polyfill process
      util: require.resolve('util/'),  // Polyfill util
    },
  },
  plugins: [
    // Adding the process polyfill explicitly in plugins
    new webpack.ProvidePlugin({
      process: 'process/browser',  // Explicitly provide process polyfill
    }),
    new HtmlWebpackPlugin({
      template: './src/template.html',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
});
