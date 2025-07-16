import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl'

/** @type {import('vite').UserConfig} */

const config = {
	plugins: [
		sveltekit(),
		basicSsl({
			name: 'test',
			domains: ['localhost'],
			certDir:'./testCert'
		})
	],
	server: {
		host: true,
		proxy:{}, //unsure why but needed for dev https
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			include: ['src/lib/server/models/**/*.ts']
		}
	},
};



export default config;