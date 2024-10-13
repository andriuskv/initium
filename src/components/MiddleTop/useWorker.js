import { useRef, useEffect } from "react";

export default function useWorker(handleMessage, deps) {
  const worker = useRef({});

  if (deps) {
    useEffect(() => {
      for (const id of Object.keys(worker.current)) {
        const controller = new AbortController();

        worker.current[id].abortController.abort();
        worker.current[id].abortController = controller;
        worker.current[id].ref.addEventListener("message", handleMessage, { signal: controller.signal });
      }
    }, deps);
  }

  function initWorker(params = {}) {
    if (worker.current[params.id]) {
      return;
    }
    const controller = new AbortController();

    worker.current[params.id] = {
      ref: new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
      abortController: controller
    };

    worker.current[params.id].ref.addEventListener("message", handleMessage, { signal: controller.signal });
    worker.current[params.id].ref.postMessage({ action: "start", ...params });
  }

  function destroyWorker(id) {
    if (!worker.current[id]) {
      return;
    }
    worker.current[id].abortController.abort();
    worker.current[id].ref.terminate();
    delete worker.current[id];
  }

  function destroyWorkers() {
    for (const id of Object.keys(worker.current)) {
      destroyWorker(id);
    }
  }

  function updateWorkerCallback(id, callback) {
    if (!worker.current[id]) {
      return;
    }
    const controller = new AbortController();

    worker.current[id].abortController.abort();
    worker.current[id].ref.addEventListener("message", callback, { signal: controller.signal });
    worker.current[id].abortController = controller;
  }

  function updateDuration(id, duration) {
    if (!worker.current[id]) {
      return;
    }
    worker.current[id].ref.postMessage({ action: "update-duration", duration });
  }

  return { initWorker, destroyWorker, destroyWorkers, updateWorkerCallback, updateDuration };
}
