module.exports = {
    semi: true,
    trailingComma: "all",
    tabWidth: 4,
    overrides: [
        {
            files: ["*.json","*.yml"],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
