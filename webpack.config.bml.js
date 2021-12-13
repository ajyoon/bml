const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

const config = {
  entry: [
    './bml.js',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bml.bundle.min.js',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          // `.swcrc` can be used to configure swc
          loader: "swc-loader"
        }
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
    minimizer: [new TerserPlugin({
        terserOptions: {
          format: {
            comments: /@license/i,
          },
        },
        extractComments: false,
    })]
  }
};

module.exports = config;
