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
		fs: {
			allow: [
				'thumb/'
			],
		},
		proxy:{}, //unsure why but needed for dev https
	},
};



export default config;
