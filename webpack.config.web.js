const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

const config = {
  entry: [
    './src/bml.ts',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bml.bundle.min.js',
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules)/,
        use: {
          // `.swcrc` can be used to configure swc
          loader: "swc-loader"
        }
      },
      {
        test: require.resolve('./src/bml.ts'),
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
