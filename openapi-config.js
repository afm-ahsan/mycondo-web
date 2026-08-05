/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */

// Consumes mycondo-api's exported OpenAPI 3.1 spec (see openapi/mycondo-api.json — regenerate with
// `curl -k https://localhost:7219/openapi/v1.json -o openapi/mycondo-api.json` against a running
// backend, then `npm run codegen:api`). Injects into the shared baseApi (src/api/baseApi.ts) — see
// ADR-005. Backend port per docs/local-development-ports.md.
// Plain .js (not .ts): the codegen CLI needs esbuild-runner/ts-node to load a TS config, neither of
// which is installed — avoid the extra dependency since this file needs no real type-checking.
const config = {
  schemaFile: './openapi/mycondo-api.json',
  apiFile: './src/api/baseApi.ts',
  apiImport: 'baseApi',
  outputFile: './src/api/generated/mycondoApi.ts',
  exportName: 'mycondoApi',
  hooks: { queries: true, lazyQueries: true, mutations: true },
  tag: true,
};

export default config;
