module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^\[(.*?)\] (.*)$/,
      headerCorrespondence: ["type", "subject"],
    },
  },
  rules: {
    "type-empty": [2, "never"],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "test", "docs", "chore"],
    ],
    "subject-empty": [2, "never"],
  },
};
