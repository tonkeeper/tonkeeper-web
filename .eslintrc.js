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
        eqeqeq: ['error', 'smart'],
        // disabled: most violations are essential complexity in React render branches
        // (state-machine dispatch on discriminated unions) where splitting helpers
        // hides cases behind indirection without reducing total cognitive load
        complexity: 'off',
        'no-empty': ['error'],
        'no-restricted-globals': 'error',
        'no-param-reassign': 'off',
        'no-prototype-builtins': 'off',

        /* styles */
        'array-bracket-spacing': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        indent: 'off',
        // codebase deliberately groups tightly-coupled classes in single files
        // (Atom/Subject/ReplaySubject, polyfill class sets, SDK + helpers)
        'max-classes-per-file': 'off',
        radix: ['error', 'as-needed'],
        'no-return-assign': 'off',
        'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
        'no-console': [
            'warn',
            {
                allow: ['debug', 'error', 'info']
            }
        ],
        'prettier/prettier': 'error'
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
                'plugin:i18next/recommended',
                'prettier'
            ],
            rules: {
                /* imports */
                'import/extensions': [
                    'error',
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
                    'error',
                    {
                        vars: 'all',
                        args: 'all',
                        ignoreRestSiblings: false,
                        argsIgnorePattern: '^_',
                        varsIgnorePattern: '^_'
                    }
                ],
                // disabled in favor of unused-imports/no-unused-vars (above), which honors the ^_ ignore pattern
                '@typescript-eslint/no-unused-vars': 'off',
                'prefer-const': 'error',

                /* typescript */
                '@typescript-eslint/no-use-before-define': 'off',
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/no-explicit-any': 'error',
                '@typescript-eslint/no-inferrable-types': 'error',
                '@typescript-eslint/naming-convention': [
                    'error',
                    {
                        selector: 'enumMember',
                        format: ['UPPER_CASE']
                    }
                ],
                '@typescript-eslint/dot-notation': 'error',
                '@typescript-eslint/comma-dangle': ['error', 'never'],
                '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
                '@typescript-eslint/no-shadow': 'error',
                '@typescript-eslint/return-await': 'error',
                '@typescript-eslint/indent': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                '@typescript-eslint/no-redeclare': ['error', { ignoreDeclarationMerge: true }],
                '@typescript-eslint/ban-types': 'error',
                '@typescript-eslint/no-unused-expressions': 'error',

                /* react */
                'react/react-in-jsx-scope': 'off',
                'i18next/no-literal-string': [
                    'error',
                    {
                        words: {
                            // user options replace defaults entirely, so we re-list the
                            // plugin defaults (numbers/symbols, uppercase tokens, html
                            // entities, emoji) alongside our brand/protocol exemptions
                            exclude: [
                                '[0-9!-/:-@[-`{-~]+',
                                '[A-Z_-]+',
                                require('eslint-plugin-i18next/lib/options/htmlEntities'),
                                /^\p{Emoji}+$/u,
                                'Tonkeeper',
                                'Tonkeeper Pro',
                                'Tonkeeper Web',
                                'Ton Console',
                                'Tonviewer',
                                'TRC20',
                                'Beta',
                                'Testnet',
                                'Ledger',
                                'Signer',
                                'USD₮',
                                '≈'
                            ]
                        }
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
