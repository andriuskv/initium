let runningTimers: string[] = [];

function addToRunning(name: string) {
  runningTimers.push(name);
}

function removeFromRunning(name: string) {
  runningTimers = runningTimers.filter(item => item !== name);
}

function isLastRunningTimer(name: string) {
  return runningTimers.at(-1)?.startsWith(name);
}

function isRunning(name: string) {
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
