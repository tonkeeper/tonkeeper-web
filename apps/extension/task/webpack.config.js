const path = require('path');
const { ProvidePlugin, EnvironmentPlugin } = require('webpack');

module.exports = [
    {
        target: 'browserslist',
        mode: 'production',
        entry: './src/background.ts',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            fallback: {
                buffer: require.resolve('buffer/'),
                'process/browser': require.resolve('process/browser'),
                stream: require.resolve('stream-browserify')
            }
        },
        output: {
            filename: 'background.js',
            path: path.resolve(__dirname, '../build')
        },
        plugins: [
            new ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
                process: 'process/browser'
            }),
            new EnvironmentPlugin(['REACT_APP_APTABASE', 'REACT_APP_APTABASE_HOST'])
        ]
    },
    {
        target: 'node',
        mode: 'production',
        entry: './src/provider.ts',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        output: {
            filename: 'provider.js',
            path: path.resolve(__dirname, '../build')
        }
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
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        output: {
            filename: 'content.js',
            path: path.resolve(__dirname, '../build')
        }
    }
];
