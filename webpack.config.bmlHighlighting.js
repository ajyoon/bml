const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

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
  plugins: [
    // new UglifyJSPlugin()
  ],
};

module.exports = config;
