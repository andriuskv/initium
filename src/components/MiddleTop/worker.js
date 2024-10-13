let timeoutId = 0;
let params = null;

onmessage = function({ data }) {
  const { id, type, action, duration } = data;

  if (type === "clock") {
    updateClock();
  }
  else if (action === "start") {
    clearTimeout(timeoutId);

    if (duration) {
      params = { id, duration: duration || 0 };
      countdown(performance.now());
    }
    else {
      update(performance.now(), data.elapsed || 0);
    }
  }
  else if (action === "stop") {
    clearTimeout(timeoutId);
    timeoutId = 0;
  }
  else if (action === "update-duration") {
    params.duration = duration;
  }
};

function countdown(elapsed) {
  const interval = 1000;
  const diff = performance.now() - elapsed;

  elapsed += interval;
  params.duration -= 1;

  timeoutId = setTimeout(() => {
    postMessage({ elapsed, diff: interval, ...params });

    if (params.duration >= 0) {
      countdown(elapsed);
    }
  }, interval - diff);
}

function update(start, elapsed = 0) {
  const interval = 20;
  const diff = performance.now() - start;

  start += interval;
  elapsed += interval;

  postMessage({ diff: interval, elapsed });

  timeoutId = setTimeout(() => {
    update(start, elapsed);
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
