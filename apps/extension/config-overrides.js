const { removeModuleScopePlugin } = require('customize-cra');
const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
    removeModuleScopePlugin()(config);

    config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify')
    };

    config.resolve.alias = {
        ...config.resolve.alias,
        react: path.resolve(__dirname, './node_modules/react'),
        '@ton/core': path.resolve(__dirname, '../../packages/core/node_modules/@ton/core'),
        '@ton/crypto': path.resolve(__dirname, '../../packages/core/node_modules/@ton/crypto'),
        '@ton/ton': path.resolve(__dirname, '../../packages/core/node_modules/@ton/ton'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
        'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
        'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
        '@tanstack/react-query': path.resolve(__dirname, './node_modules/@tanstack/react-query')
    };

    config.resolve.extensions = [...config.resolve.extensions, '.ts', '.js'];
    config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ];

    return config;
};
