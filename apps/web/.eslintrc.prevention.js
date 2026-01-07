/**
 * ESLint Configuration for Issue Prevention
 *
 * This configuration file extends the main .eslintrc.js to add
 * specific rules that prevent the 5 fixed issues:
 * 1. Console statements logging sensitive data
 * 2. Unsafe `as unknown as` type casts
 * 3. Duplicated code across schemas
 * 4. Dead code accumulation
 * 5. Large default objects duplicating schema definitions
 *
 * Usage: Merge rules into main .eslintrc.js
 */

module.exports = {
  rules: {
    // =================================================================
    // ISSUE 1: Console Statements Logging Sensitive Data
    // =================================================================

    'no-console': [
      'error',
      {
        allow: ['error', 'warn'],
        // console.log, console.debug, console.info are forbidden
      },
    ],

    // Consolidated no-restricted-syntax rule (all selectors in one array)
    'no-restricted-syntax': [
      'error',
      // ISSUE 1: Console statements
      {
        selector: 'CallExpression[callee.object.name="console"][callee.property.name="log"]',
        message:
          'Use logger.log() from @/lib/logging/logger instead of console.log()',
      },
      {
        selector: 'CallExpression[callee.object.name="console"][callee.property.name="debug"]',
        message:
          'Use logger.debug() from @/lib/logging/logger instead of console.debug()',
      },
      {
        selector: 'CallExpression[callee.object.name="console"][callee.property.name="info"]',
        message:
          'Use logger.info() from @/lib/logging/logger instead of console.info()',
      },
      {
        // Prevent logging sensitive LLM fields
        selector: 'TemplateLiteral > Identifier[name="state"]',
        message:
          'Avoid interpolating state into logs. Use redactForLogging() function.',
      },
      {
        selector: 'TemplateLiteral > MemberExpression[property.name="content"]',
        message:
          'LLM response content should not be logged. Use structured logging with redaction.',
      },
      {
        selector:
          'TemplateLiteral > MemberExpression[property.name="originalAsk"]',
        message:
          'User problem statement should not be logged. This is sensitive data.',
      },
      {
        selector:
          'TemplateLiteral > MemberExpression[property.name="designChallenge"]',
        message:
          'Design challenge should not be logged to console. Use logger.debug() with redaction.',
      },
      // ISSUE 2: Double type casts
      {
        selector: 'TSAsExpression > TSAsExpression',
        message:
          'Double type casts (as X as Y) bypass type safety. Use type guards, Zod validation, or proper type definitions instead. Common pattern: use z.safeParse() for runtime validation.',
      },
      // ISSUE 5: Large default objects
      {
        selector:
          'VariableDeclarator[id.name=/^[A-Z_]+_DEFAULTS?$/] > ObjectExpression',
        message:
          'Large default objects should be derived from schemas using factory functions. Define a Zod schema and use z.infer<> for types.',
      },
    ],

    // =================================================================
    // ISSUE 2: Unsafe `as unknown as` Type Casts
    // =================================================================

    '@typescript-eslint/no-explicit-any': [
      'error',
      {
        fixToUnknown: false,
        ignoreRestArgs: false,
      },
    ],

    '@typescript-eslint/no-unnecessary-type-assertion': 'error',

    '@typescript-eslint/no-unsafe-member-access': 'error',

    '@typescript-eslint/no-unsafe-call': 'error',

    '@typescript-eslint/no-unsafe-return': 'error',

    '@typescript-eslint/no-unsafe-assignment': 'error',

    '@typescript-eslint/strict-boolean-expressions': 'error',

    // =================================================================
    // ISSUE 3: Duplicated Code Across Schemas
    // =================================================================

    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '**/lib/llm/prompts/*/schemas.ts',
              '!**/lib/llm/schemas/**',
            ],
            message:
              'Import schemas from lib/llm/schemas/index.ts instead of individual prompt files. Consolidate duplicate schema definitions.',
          },
          {
            group: [
              '**/schemas/**',
              '!**/lib/llm/schemas/**',
              '!**/lib/**',
            ],
            message:
              'Schemas should be defined in lib/llm/schemas/. Do not create duplicate schema files.',
          },
        ],
      },
    ],

    // Flag schema pattern repetition
    '@typescript-eslint/no-restricted-syntax': [
      'error',
      {
        selector:
          'ExportNamedDeclaration > VariableDeclaration[id.name=/^.*Schema$/]',
        message:
          'Schema definition found. Check lib/llm/schemas/ to avoid duplication. Schemas should be composed from shared definitions.',
      },
    ],

    // =================================================================
    // ISSUE 4: Dead Code Accumulation
    // =================================================================

    'no-unused-vars': 'off', // Use @typescript-eslint version instead
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],

    'no-undef': 'error',

    'no-constant-condition': [
      'error',
      {
        checkLoops: true,
      },
    ],

    'no-unreachable': 'error',

    'no-unreachable-loop': 'error',

    'unused-imports/no-unused-imports': 'error',

    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // =================================================================
    // ISSUE 5: Large Default Objects
    // =================================================================

    'no-magic-numbers': [
      'error',
      {
        ignore: [0, 1, -1, 2, 100],
        enforceConst: true,
        ignoreArrayIndexes: true,
        ignoreTypeIndexes: true,
        ignoreDefaultValues: true,
      },
    ],

    // =================================================================
    // Cross-Cutting Rules
    // =================================================================

    // Prevent any type usage
    '@typescript-eslint/no-implicit-any-catch': 'error',

    // Require proper error handling
    '@typescript-eslint/promise-function-async': 'error',

    'no-throw-literal': 'error',

    '@typescript-eslint/no-throw-literal': 'error',

    // Code clarity rules
    '@typescript-eslint/explicit-function-return-types': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],

    '@typescript-eslint/explicit-module-boundary-types': 'error',

    // Prevent silent failures
    '@typescript-eslint/return-await': 'error',

    'no-empty': [
      'error',
      {
        allowEmptyCatch: false,
      },
    ],
  },

  // =================================================================
  // Recommended ESLint Plugins for Prevention
  // =================================================================
  // Add these to package.json:
  // - eslint-plugin-unused-imports
  // - eslint-plugin-security
  // - @typescript-eslint/eslint-plugin
  // - @typescript-eslint/parser

  overrides: [
    {
      files: ['lib/llm/**/*.ts'],
      rules: {
        // Extra strict rules for LLM code
        'no-console': 'error', // No exceptions in LLM code
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/explicit-function-return-types': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
      },
    },
    {
      files: ['**/*.schema.ts'],
      rules: {
        // Schema files should be pure and contain no logic
        'no-console': 'error',
        '@typescript-eslint/no-unused-vars': ['error'],
      },
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        // Test files have more flexibility
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off', // Allow console in tests for debugging
      },
    },
  ],
};
