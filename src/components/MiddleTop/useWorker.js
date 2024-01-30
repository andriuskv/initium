import { useRef } from "react";

export default function useWorker(handleMessage) {
  const worker = useRef(null);

  function initWorker(params = {}) {
    if (worker.current) {
      return;
    }
    const controller = new AbortController();

    worker.current = {
      ref: new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
      abortController: controller
    };

    worker.current.ref.addEventListener("message", handleMessage, { signal: controller.signal });
    worker.current.ref.postMessage({ action: "start", ...params });
  }

  function destroyWorker() {
    if (!worker.current) {
      return;
    }
    worker.current.abortController.abort();
    worker.current.ref.terminate();
    worker.current = null;
  }

  return [initWorker, destroyWorker];
}
