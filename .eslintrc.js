module.exports =  { //eslint-disable-line
    "env": {
        "browser": true,
        "es2021": true,
    },
    "extends": [
        "eslint:recommended", 
        "plugin:@typescript-eslint/recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "indent": "off",
        "@typescript-eslint/indent": [ "error", 4, { "FunctionDeclaration": { parameters: 2 } } ],
        "@typescript-eslint/no-explicit-any": "off",
        "object-curly-spacing": [ "error", "always" ],
        'semi': [ 'error', 'never' ],
        'space-in-parens': [ 'error', 'always' ],
        'template-curly-spacing': [ 'error', 'always' ],
        'array-bracket-spacing': [ 'error', 'always' ],
        'computed-property-spacing': [ 'error', 'always' ],
        'linebreak-style': 'off',
        'no-console': [ 'error', { allow: [ 'warn', 'error' ] } ],
        'func-names': 'off',
        'import/order': 'off',
        'arrow-parens': [ 'error', 'as-needed' ],
        'space-infix-ops': 'error',
        'space-unary-ops': [
            2, {
                words: true,
                nonwords: true,
            } ],
    },
    "globals": {
        "__dirname": true
    }
}