module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    ignorePatterns: ['node_modules', 'dist'],
    extends: ['plugin:prettier/recommended', 'prettier'],
    rules: {
        /* common */
        'no-underscore-dangle': 'off',
        'no-plusplus': 'off',
        'class-method-use-this': 'off',
        eqeqeq: ['warn', 'smart'], // baseline: ~10 violations; promote to 'error' once cleaned up
        complexity: ['warn', { max: 15 }], // baseline: 25 violations at max 15
        'no-empty': ['error'],
        'no-restricted-globals': 'error',
        'no-param-reassign': 'off',
        'no-prototype-builtins': 'off',

        /* styles */
        'array-bracket-spacing': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        indent: 'off',
        'max-classes-per-file': 'warn', // baseline: ~7 violations; either split files or add inline disable
        radix: ['error', 'as-needed'],
        'no-return-assign': 'off',
        'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
        'no-console': [
            'warn',
            {
                allow: ['debug', 'error', 'info']
            }
        ],
        // baseline: prettier/prettier set to 'error' by plugin:prettier/recommended; demoted while
        // existing formatting drift is cleaned up
        'prettier/prettier': 'warn'
    },
    overrides: [
        {
            files: ['**/*.ts'],
            parserOptions: {
                parser: '@typescript-eslint/parser',
                sourceType: 'module',
                ecmaVersion: 'latest'
            }
        },
        {
            files: ['src/**/*.tsx', 'tests/**/*.tsx'],
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        {
            files: ['src/**/*.ts', 'src/**/*.tsx'],
            parserOptions: {
                project: './tsconfig.json'
            }
        },
        {
            files: ['tests/**/*.ts', 'tests/**/*.tsx'],
            parserOptions: {
                project: './tsconfig.test.json'
            }
        },
        {
            files: ['src/**/*.ts', 'src/**/*.tsx', 'tests/**/*.ts', 'tests/**/*.tsx'],
            plugins: [
                'react',
                'react-hooks',
                '@typescript-eslint',
                'import',
                'unused-imports',
                'i18next'
            ],
            extends: [
                'airbnb-typescript/base',
                'plugin:react/recommended',
                'plugin:react-hooks/recommended',
                'plugin:@typescript-eslint/recommended',
                'plugin:i18next/recommended'
            ],
            rules: {
                /* imports */
                'import/extensions': [
                    'warn', // baseline: ~4 violations
                    'never',
                    {
                        scss: 'always',
                        css: 'always',
                        json: 'always',
                        svg: 'always'
                    }
                ],
                'import/prefer-default-export': 'off',
                'import/no-extraneous-dependencies': [
                    'error',
                    { devDependencies: false, optionalDependencies: false, peerDependencies: false }
                ],
                // import/no-unresolved without a TypeScript resolver produces thousands of
                // false positives in this workspace setup (e.g. @tonkeeper/core/dist/... and
                // styled-components subpath imports). Disable until eslint-import-resolver-typescript
                // is configured.
                'import/no-unresolved': 'off',
                'unused-imports/no-unused-imports': 'error',
                'unused-imports/no-unused-vars': [
                    'warn', // baseline: ~7 violations
                    {
                        vars: 'all',
                        args: 'all',
                        ignoreRestSiblings: false,
                        argsIgnorePattern: '^_',
                        varsIgnorePattern: '^_'
                    }
                ],
                'prefer-const': 'warn', // baseline: ~2 violations (autofix didn't catch them)

                /* typescript */
                '@typescript-eslint/no-use-before-define': 'off',
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/no-explicit-any': 'warn', // baseline: ~13 violations
                '@typescript-eslint/no-inferrable-types': 'error',
                '@typescript-eslint/naming-convention': [
                    'warn', // baseline: ~2 violations
                    {
                        selector: 'enumMember',
                        format: ['UPPER_CASE']
                    }
                ],
                '@typescript-eslint/dot-notation': 'error',
                '@typescript-eslint/comma-dangle': ['error', 'never'],
                '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
                '@typescript-eslint/no-shadow': 'warn', // baseline: ~8 violations
                '@typescript-eslint/return-await': 'error',
                '@typescript-eslint/indent': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                '@typescript-eslint/no-redeclare': ['error', { ignoreDeclarationMerge: true }],
                '@typescript-eslint/ban-types': 'warn', // baseline: ~2 violations (recommended ruleset)
                '@typescript-eslint/no-unused-expressions': 'warn', // baseline: ~2 violations (recommended ruleset)

                /* react */
                'react/react-in-jsx-scope': 'off',
                'i18next/no-literal-string': [
                    'warn',
                    {
                        exclude: ['Ton Console']
                    }
                ],
                'react-hooks/rules-of-hooks': 'error',
                'react-hooks/exhaustive-deps': 'warn', // baseline: 269 violations; stale-closure detection re-enabled (was off)
                'react/display-name': 'off',
                'react/prop-types': 'off'
            },
            settings: {
                react: {
                    version: 'detect'
                }
            }
        },
        {
            files: ['tests/**/*.ts', 'tests/**/*.tsx'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'off',
                'import/no-extraneous-dependencies': ['error', { devDependencies: true }]
            }
        }
    ]
};
