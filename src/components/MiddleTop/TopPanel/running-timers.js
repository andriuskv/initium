let runningTimers = [];

function addToRunning(name) {
  runningTimers.push(name);
}

function removeFromRunning(name) {
  runningTimers = runningTimers.filter(item => item !== name);
}

function getLastRunningTimer() {
  return runningTimers.at(-1);
}

function isLastRunningTimer(name) {
  return runningTimers.at(-1) === name;
}

export {
  addToRunning,
  removeFromRunning,
  getLastRunningTimer,
  isLastRunningTimer
};
