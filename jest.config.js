export default {
    testEnvironment: "node",
    setupFiles: ["<rootDir>/tests/env.js"],

    testMatch: [
        "**/tests/**/*.test.js"
    ],

    clearMocks: true,

    collectCoverageFrom: [
        "src/**/*.js",
        "!src/server.js",
        "!src/config/env.js"
    ]
};