module.exports = {
    root: true,
    ignorePatterns: ['node_modules', 'dist'],
    extends: ['plugin:prettier/recommended', 'prettier'],
    rules: {
        /* common */
        'no-underscore-dangle': 'off',
        'no-plusplus': 'off',
        'class-method-use-this': 'off',
        eqeqeq: ['error', 'smart'],
        complexity: 'error',
        'no-empty': ['error'],
        'no-restricted-globals': 'error',
        'no-param-reassign': 'off',
        'no-prototype-builtins': 'off',

        /* styles */
        'array-bracket-spacing': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        indent: 'off',
        'max-classes-per-file': 'error',
        radix: ['error', 'as-needed'],
        'no-return-assign': 'off',
        'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
        'no-console': [
            'warn',
            {
                allow: ['debug', 'error', 'info']
            }
        ]
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
                'chakra-ui',
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

                /* react */
                'react/react-in-jsx-scope': 'off',
                'i18next/no-literal-string': [
                    'warn',
                    {
                        exclude: ['Ton Console']
                    }
                ],
                'react-hooks/rules-of-hooks': 'error',
                'react-hooks/exhaustive-deps': 'off',
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
