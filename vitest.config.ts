import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Standalone config: the domain logic under test is plain TypeScript, so we
// deliberately do not load the SvelteKit Vite plugin here.
export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	}
});
