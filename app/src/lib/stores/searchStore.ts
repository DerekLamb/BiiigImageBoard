import { writable } from "svelte/store";

export const search = writable("");
export const imageSize = writable(200)
export const currPage = writable(1);