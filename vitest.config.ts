import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@donttrust/common': path.resolve(__dirname, './packages/common/src/index.ts'),
      '@donttrust/finding-schema': path.resolve(__dirname, './packages/finding-schema/src/index.ts'),
      '@donttrust/protocol-models': path.resolve(__dirname, './packages/protocol-models/src/index.ts'),
      '@donttrust/scope-engine': path.resolve(__dirname, './packages/scope-engine/src/index.ts'),
      '@donttrust/scanner-sdk': path.resolve(__dirname, './packages/scanner-sdk/src/index.ts'),
      '@donttrust/storage': path.resolve(__dirname, './packages/storage/src/index.ts'),
      '@donttrust/rules': path.resolve(__dirname, './rules/src/index.ts')
    }
  }
});
