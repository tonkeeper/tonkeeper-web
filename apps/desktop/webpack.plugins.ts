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
        'process.env': {},
        REACT_APP_AMPLITUDE: JSON.stringify(process.env.REACT_APP_AMPLITUDE),
        REACT_APP_TONCONSOLE_API: JSON.stringify(process.env.REACT_APP_TONCONSOLE_API),
        REACT_APP_TG_BOT_ID: JSON.stringify(process.env.REACT_APP_TG_BOT_ID),
        REACT_APP_TG_BOT_ORIGIN: JSON.stringify(process.env.REACT_APP_TG_BOT_ORIGIN),
        REACT_APP_STONFI_REFERRAL_ADDRESS: JSON.stringify(
            process.env.REACT_APP_STONFI_REFERRAL_ADDRESS
        ),
        REACT_APP_APTABASE: JSON.stringify(process.env.REACT_APP_APTABASE),
        REACT_APP_APTABASE_HOST: JSON.stringify(process.env.REACT_APP_APTABASE_HOST)
    })
];
