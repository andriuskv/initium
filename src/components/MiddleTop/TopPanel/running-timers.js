let runningTimers = [];

function addToRunning(name) {
  runningTimers.push(name);
}

function removeFromRunning(name) {
  runningTimers = runningTimers.filter(item => item !== name);
}

function isLastRunningTimer(name) {
  return runningTimers.at(-1)?.startsWith(name);
}

function isRunning(name) {
  return runningTimers.some(timer => timer.startsWith(name));
}

function resetRunningTimers() {
  runningTimers.length = 0;
}

export {
  addToRunning,
  removeFromRunning,
  isLastRunningTimer,
  isRunning,
  resetRunningTimers
};
