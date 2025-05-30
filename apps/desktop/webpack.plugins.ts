import dotenv from 'dotenv';
import webpack from 'webpack';

dotenv.config();

export const plugins = [
    new webpack.DefinePlugin({
        'process.env': {},
        REACT_APP_TONCONSOLE_API: JSON.stringify(process.env.REACT_APP_TONCONSOLE_API),
        REACT_APP_TG_BOT_ID: JSON.stringify(process.env.REACT_APP_TG_BOT_ID),
        REACT_APP_TG_BOT_ORIGIN: JSON.stringify(process.env.REACT_APP_TG_BOT_ORIGIN),
        REACT_APP_STONFI_REFERRAL_ADDRESS: JSON.stringify(
            process.env.REACT_APP_STONFI_REFERRAL_ADDRESS
        ),
        REACT_APP_APTABASE: JSON.stringify(process.env.REACT_APP_APTABASE),
        REACT_APP_APTABASE_HOST: JSON.stringify(process.env.REACT_APP_APTABASE_HOST),
        REACT_APP_TRON_API_KEY: JSON.stringify(process.env.REACT_APP_TRON_API_KEY)
    })
];
