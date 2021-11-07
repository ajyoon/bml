const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

const config = {
  entry: [
    './src/highlighting.js',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bml_highlighting.bundle.js',
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
        test: require.resolve('./src/highlighting.js'),
        use: [{
          loader: 'expose-loader',
          options: 'bmlHighlighting',
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
