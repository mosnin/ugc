// Every Convex module, for convex-test: sources plus the generated api, minus
// tests, type declarations and this file. Convex skips files with more than
// one dot in the name, so this file is never deployed.
declare global {
  interface ImportMeta {
    glob(patterns: string[]): Record<string, () => Promise<unknown>>;
  }
}

export const modules = import.meta.glob([
  "./**/*.ts",
  "./**/*.js",
  "!./**/*.test.ts",
  "!./**/*.d.ts",
  "!./test.setup.ts",
]);
