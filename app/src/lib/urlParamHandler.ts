
export function updateUrlParam(param: string, value: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

export function removeUrlParam(param: string): void {
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.pushState({}, '', url);
}

export function readUrlParam(param: string): string | null {
    const url = new URL(window.location.href);
    return url.searchParams.get(param);
}