import { configDefaults, defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  envDir: false,
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: ['./test/setup.ts'],
    root: './',
    include: ['**/*.spec.ts'],
    exclude: [
      ...configDefaults.exclude,
      '**/.stryker-tmp/**',
      'tmp/**',
      'reports/**',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.d.ts'],
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcovonly', 'json-summary'],
      reportOnFailure: true,
    },
  },
});
