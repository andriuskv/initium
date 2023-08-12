let id = 0;

onmessage = function({ data }) {
  const { action, duration } = data;

  if (action === "start") {
    clearTimeout(id);

    if (duration) {
      countdown(performance.now(), duration);
    }
    else {
      update(performance.now());
    }
  }
  else if (action === "stop") {
    clearTimeout(id);
    id = 0;
  }
};

function countdown(elapsed, duration = 0) {
  const interval = 1000;
  const diff = performance.now() - elapsed;

  elapsed += interval;
  duration -= 1;

  id = setTimeout(() => {
    postMessage({ elapsed, diff: interval, duration });

    if (duration > 0) {
      countdown(elapsed, duration);
    }
  }, interval - diff);
}

function update(elapsed) {
  const interval = 20;
  const diff = performance.now() - elapsed;

  elapsed += interval;

  postMessage({ elapsed, diff: interval });

  id = setTimeout(() => {
    update(elapsed, interval);
  }, interval - diff);
}
