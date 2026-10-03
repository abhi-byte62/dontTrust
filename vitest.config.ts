import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@aegisscan/common': path.resolve(__dirname, './packages/common/src/index.ts'),
      '@aegisscan/finding-schema': path.resolve(__dirname, './packages/finding-schema/src/index.ts'),
      '@aegisscan/protocol-models': path.resolve(__dirname, './packages/protocol-models/src/index.ts'),
      '@aegisscan/scope-engine': path.resolve(__dirname, './packages/scope-engine/src/index.ts'),
      '@aegisscan/scanner-sdk': path.resolve(__dirname, './packages/scanner-sdk/src/index.ts'),
      '@aegisscan/storage': path.resolve(__dirname, './packages/storage/src/index.ts'),
      '@aegisscan/rules': path.resolve(__dirname, './rules/src/index.ts')
    }
  }
});
