module.exports = {
    "roots": [
        "<rootDir>/src"
    ],
    "testMatch": [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    "globals": {
        "ts-jest": {
            "tsconfig": "tsconfig.json"
        }
    },
    "moduleNameMapper": {
        "#core": "<rootDir>/src/core",
        "#templates/(.*)": "<rootDir>/src/templates/$1",
        "#constants/(.*)": "<rootDir>/src/constants/$1",
        "#utils/(.*)": "<rootDir>/src/utils/$1"
    }
}