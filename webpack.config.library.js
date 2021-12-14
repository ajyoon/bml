const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

const config = {
  entry: [
    './src/bml.ts',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
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
          loader: "swc-loader",
          options: {
            "module": {
              "type": "commonjs"
            }
          }
        }
      }
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
