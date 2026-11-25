// Next 16.4 references these names; TS 5.9's DOM library does not declare them.
// Match the platform types already supplied by Node 24 rather than skipping checks.
export {};
declare global {
  type URLPatternInput = string | URLPatternInit;
  type URLPatternOptions = import('node:url').URLPatternOptions;
}
