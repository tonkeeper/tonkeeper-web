const path = require('path');
const { ProvidePlugin } = require('webpack');

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
                buffer: require.resolve('buffer/')
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
            })
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
