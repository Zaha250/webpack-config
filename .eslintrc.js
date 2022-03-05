module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        node: true,
        jquery: true
    },
    extends: [
        "eslint:recommended",
        "react-app",
        "plugin:react/recommended"
    ],
    rules: {
        "no-duplicate-imports": "warn",
        "no-unused-vars": "warn",
        "react/prop-types": 'off',
        "import/no-anonymous-default-export": ["warn", {
            "allowArray": true,
            "allowObject": true
        }]
    },
    globals: {
        "google": true,
        "flatpickr": true,
        "getUrlFromString": true,
        "Dropzone": true,
        "get_error": true,
        "get_successful": true,
        "location": true,
    }
};