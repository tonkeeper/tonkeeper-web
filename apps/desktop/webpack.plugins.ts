import dotenv from 'dotenv';
import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
    new ForkTsCheckerWebpackPlugin({
        logger: 'webpack-infrastructure'
    }),
    new webpack.DefinePlugin({
        REACT_APP_AMPLITUDE: JSON.stringify(process.env.REACT_APP_AMPLITUDE),
        REACT_APP_TONCONSOLE_API: JSON.stringify(process.env.REACT_APP_TONCONSOLE_API),
        REACT_APP_TG_BOT_ID: JSON.stringify(process.env.REACT_APP_TG_BOT_ID)
    })
];
