module.exports = {
    extends: ['../../.eslintrc.js'],
    overrides: [
        {
            files: ['playwright/**/*.ts', 'playwright/**/*.tsx', '**/*.ct.tsx'],
            rules: {
                'import/no-extraneous-dependencies': ['error', { devDependencies: true }]
            }
        }
    ]
};
