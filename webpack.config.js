const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const config = {
  entry: './bml.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bml.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      },
      {
        test: require.resolve('bml'),
        use: [{
          loader: 'expose-loader',
          options: 'bml'
        }]
      }
    ]
  },
  plugins: [
    //new UglifyJSPlugin()
  ]
};

module.exports = config;
