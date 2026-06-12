const config = {
  extends: ['@commitlint/config-conventional'],
  formatter: '@commitlint/format',
  rules: {
    'scope-empty': [2, 'always'],
    'no-empty-brackets': [2, 'always'],
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'ci', 'docs', 'test']],
    'subject-case': [0],
  },
  plugins: [
    // Prevents empty brackets in the header (e.g. "feat(): ..."), which the
    // scope-empty rule does not catch on its own.
    {
      rules: {
        'no-empty-brackets': ({ header }) => {
          if (!header) {
            return [true];
          }

          const hasEmptyBrackets = header.includes('()');
          return [!hasEmptyBrackets, "header must not contain empty brackets '()'"];
        },
      },
    },
  ],
};

export default config;
