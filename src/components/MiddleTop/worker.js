let timeoutId = 0;

onmessage = function({ data }) {
  const { id, type, action, duration } = data;

  if (type === "clock") {
    updateClock();
  }
  else if (action === "start") {
    clearTimeout(timeoutId);

    if (duration) {
      countdown(performance.now(), { id, duration });
    }
    else {
      update(performance.now());
    }
  }
  else if (action === "stop") {
    clearTimeout(timeoutId);
    timeoutId = 0;
  }
};

function countdown(elapsed, params = { duration: 0 }) {
  const interval = 1000;
  const diff = performance.now() - elapsed;

  elapsed += interval;
  params.duration -= 1;

  timeoutId = setTimeout(() => {
    postMessage({ elapsed, diff: interval, ...params });

    if (params.duration >= 0) {
      countdown(elapsed, params);
    }
  }, interval - diff);
}

function update(elapsed) {
  const interval = 20;
  const diff = performance.now() - elapsed;

  elapsed += interval;

  postMessage({ diff: interval });

  timeoutId = setTimeout(() => {
    update(elapsed);
  }, interval - diff);
}

function updateClock(elapsed = 0) {
  const interval = 1000;
  const diff = performance.now() - elapsed;

  elapsed += interval;
  postMessage(null);

  timeoutId = setTimeout(() => {
    updateClock(elapsed);
  }, interval - diff);
}
