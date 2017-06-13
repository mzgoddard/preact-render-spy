const {join} = require('path');

const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const wepbackif = require('webpack-if');

module.exports = {
  context: __dirname,
  entry: './src/entry',
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: [join(__dirname, 'node_modules')],
        loader: 'babel-loader',
        options: {
          presets: ['preact', 'env'],
        },
      }
    ],
  },
  plugins: [
    new HardSourceWebpackPlugin(),
  ],
};
