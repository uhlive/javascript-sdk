module.exports = {
    extends: [
        "@ts-engine/eslint-config",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "plugin:jsdoc/recommended",
    ],
    plugins: ["jsdoc", "typescript-sort-keys"],
    rules: {
        "@typescript-eslint/member-ordering": [
            2,
            {
                default: {
                    memberTypes: [
                        "signature",
                        "field",
                        "constructor",
                        "public-method",
                        "private-method",
                    ],
                    order: "alphabetically",
                },
            },
        ],
        "import/order": [
            2,
            {
                alphabetize: {
                    order: "asc",
                },
            },
        ],
        "jsdoc/check-tag-names": [
            2,
            {
                definedTags: ["category"],
            },
        ],
        "jsdoc/no-types": 2,
        "jsdoc/require-description": [2, { exemptedBy: ["ignore"] }],
        "jsdoc/require-description-complete-sentence": 2,
        "jsdoc/require-example": [2, { exemptedBy: ["ignore"] }],
        "jsdoc/require-jsdoc": [
            2,
            {
                publicOnly: true,
            },
        ],
        "jsdoc/require-param": 0,
        "jsdoc/require-param-type": 0,
        "jsdoc/require-returns": 0,
        "no-console": [2, { allow: ["warn", "error"] }],
        "sort-keys": 2,
        "typescript-sort-keys/interface": 2,
        "typescript-sort-keys/string-enum": 2,
    },
    settings: {
        jsdoc: {
            mode: "typescript",
        },
    },
};
