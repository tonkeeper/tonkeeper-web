module.exports = {
    extends: ['../../.eslintrc.js'],
    overrides: [
        {
            // The kit has no i18n of its own: user-facing text arrives through
            // props, and the literals left are defaults and test fixtures.
            files: ['src/**/*.ts', 'src/**/*.tsx', 'playwright/**/*.ts', 'playwright/**/*.tsx'],
            rules: {
                'i18next/no-literal-string': 'off',
                'import/no-extraneous-dependencies': ['error', { devDependencies: true }]
            }
        }
    ]
};
