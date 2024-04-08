import { sveltekit } from '@sveltejs/kit/vite';
import viteBasicSslPlugin from '@vitejs/plugin-basic-ssl';
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
		
	}
};



export default config;
