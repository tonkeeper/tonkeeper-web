const path = require('path');

module.exports = [
  {
    target: 'node',
    mode: 'production',
    entry: './src/provider.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'provider.js',
      path: path.resolve(__dirname, '../build'),
    },
  },
  {
    target: 'node',
    mode: 'production',
    entry: './src/content.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'content.js',
      path: path.resolve(__dirname, '../build'),
    },
  },
];
