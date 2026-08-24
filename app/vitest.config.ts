import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';
import path from 'node:path';

// Vitest runs the SSR pipeline even in jsdom, so `svelte` subpaths resolve to
// their server builds (mount() unavailable). Redirect them to the browser
// builds declared in svelte's package.json exports so component rendering
// works in tests.
const require = createRequire(import.meta.url);
const svelteExports = require('svelte/package.json').exports as Record<string, unknown>;
const svelteRoot = path.dirname(require.resolve('svelte/package.json'));

function svelteClientAlias(id: string): string | undefined {
	if (id !== 'svelte' && !id.startsWith('svelte/')) return;
	const sub = id === 'svelte' ? '.' : `./${id.slice('svelte'.length)}`;
	const target = svelteExports[sub] as string | Record<string, string> | undefined;
	const file = typeof target === 'string' ? target : (target?.browser ?? target?.default);
	if (typeof file !== 'string') return;
	return path.join(svelteRoot, file);
}

const sveltePattern = /^svelte(\/\w+)*$/;

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser'],
		alias: [{ find: sveltePattern, customResolver: (id) => svelteClientAlias(id) }],
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.ts'],
		deps: {
			optimizer: {
				// process through Vite with browser semantics so svelte resolves
				// to its client build and the alias above applies
				web: { include: ['svelte', '@testing-library/svelte', '@testing-library/svelte-core'] },
			},
		},
	},
});
