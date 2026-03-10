module.exports = {
    extends: ['../../.eslintrc.js'],
    overrides: [
        {
            files: ['**/__tests__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
            rules: {
                'import/no-extraneous-dependencies': ['error', { devDependencies: true }]
            }
        }
    ]
};
