// Thin wrapper around the window.api bridge exposed by electron/preload.js.
// Every method returns a Promise (backed by ipcRenderer.invoke) that resolves
// with plain JSON — no Electron internals leak into the React layer.

function missingBridge() {
  throw new Error(
    'Desktop bridge unavailable. EduLedger 3D must run inside its Electron shell (npm run dev / the packaged app), not a plain browser tab.'
  );
}

const noopApi = new Proxy(
  {},
  {
    get() {
      return new Proxy(() => {}, { apply: missingBridge });
    },
  }
);

const api = typeof window !== 'undefined' && window.api ? window.api : noopApi;

export default api;
