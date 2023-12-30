import dotenv from 'dotenv';
import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';

const { parsed } = dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
    new ForkTsCheckerWebpackPlugin({
        logger: 'webpack-infrastructure'
    }),
    new webpack.DefinePlugin({
        REACT_APP_MEASUREMENT_ID: JSON.stringify(parsed!.REACT_APP_MEASUREMENT_ID)
    })
];
