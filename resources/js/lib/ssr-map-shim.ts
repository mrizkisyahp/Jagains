// Shim minimal global browser APIs when running in Node.js / SSR
// to prevent Leaflet and MapLibre from throwing "window is not defined"
if (typeof window === 'undefined') {
    const noop = () => {};
    (globalThis as any).window = {
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        requestAnimationFrame: (cb: (...args: any[]) => void) =>
            setTimeout(cb, 16),
        cancelAnimationFrame: (id: any) => clearTimeout(id),
        screen: {},
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false,
        URL: {
            createObjectURL: () => '',
            revokeObjectURL: noop,
        },
    };

    (globalThis as any).document = {
        createElement: () => ({
            style: {},
            getContext: () => null,
            setAttribute: noop,
            removeAttribute: noop,
            appendChild: noop,
            removeChild: noop,
        }),
        documentElement: { style: {} },
        head: { appendChild: noop, removeChild: noop },
        body: { appendChild: noop, removeChild: noop },
        querySelectorAll: () => [],
        getElementsByTagName: () => [],
        getElementById: () => null,
        addEventListener: noop,
        removeEventListener: noop,
    };
}
