// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

declare global {
	declare namespace App {
		interface fileMetadata {
			
		}
		// interface Error {}
		interface Locals {
			user?: User;
			session?: Session;
		}

		// interface PageData {}
		// interface Platform {}
	}
}
export {};
