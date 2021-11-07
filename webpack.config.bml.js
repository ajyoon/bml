const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

const config = {
  entry: [
    './bml.js',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bml.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: require.resolve('./bml.js'),
        use: [{
          loader: 'expose-loader',
          options: 'bml',
        }],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()]
  }
};

module.exports = config;
