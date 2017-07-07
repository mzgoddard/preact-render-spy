const {join} = require('path');

module.exports = ({
  context: __dirname,
  entry: './src/entry',
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      // We only want to parse our test files for JSX with babel, we want everything else to work in native
      // node!
      {
        test: /\.test\.js$/,
        exclude: [join(__dirname, 'node_modules')],
        loader: 'babel-loader',
        options: {
          presets: ['preact'],
        },
      },
    ],
  },
});
