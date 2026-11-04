const path = require('path');

module.exports = {
    plugins: {
        tailwindcss: { config: path.resolve(__dirname, '../../packages/uikit/tailwind.config.ts') },
        autoprefixer: {}
    }
};
