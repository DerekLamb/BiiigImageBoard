import { browser } from "$app/environment";
import { derived, readable, writable } from "svelte/store";

// export const search = writable("");
// export const imageSize = writable(200)
export const currPage = writable(1);

export const createPersistentStore = (name: string, initialValue: any) => {
    let store = writable(initialValue);
    if (!browser) return store; // required for sveltekit
  
    const storedValue = localStorage.getItem(name);
    const finalValue = storedValue ? JSON.parse(storedValue) : initialValue;
  
    store = writable(finalValue, () => {
      const unsubscribe = store.subscribe((value) => {
        localStorage.setItem(name, JSON.stringify(value));
      });
      return unsubscribe;
    });
    return store;
  };
  

export const improvSearch = createPersistentStore("search", "");
export const improvImageSize = createPersistentStore("imageSize", 200);
export const improvCurrPage = createPersistentStore("currPage", 1);
export const imageCount = createPersistentStore("imageCount", 24);
export const menuOpen = createPersistentStore("menuOpen", false);