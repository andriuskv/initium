tick();

function tick(elapsed = 0) {
  const interval = 1000;
  const diff = performance.now() - elapsed;

  elapsed += interval;
  postMessage(null);

  setTimeout(() => {
    tick(elapsed);
  }, interval - diff);
}

export { };
