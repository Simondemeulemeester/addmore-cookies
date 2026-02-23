import * as esbuild from 'esbuild';

const shared = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
};

await Promise.all([
  // IIFE bundle for Webflow (core + styles + dom-adapter)
  esbuild.build({
    ...shared,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/cookie-consent.min.js',
    format: 'iife',
    globalName: 'CookieConsent',
  }),

  // ESM core for Next.js
  esbuild.build({
    ...shared,
    entryPoints: ['src/core.ts'],
    outfile: 'dist/cookie-consent.esm.js',
    format: 'esm',
  }),

  // ESM React components
  esbuild.build({
    ...shared,
    entryPoints: ['src/react/index.tsx'],
    outfile: 'dist/react/index.js',
    format: 'esm',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
  }),
]);

console.log('Build complete');
