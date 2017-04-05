var timeout = 0;

function startTimeout() {
    var start = performance.now();

    timeout = setTimeout(() => {
        self.postMessage(start);
        startTimeout();
    }, 20);
}

self.addEventListener("message", event => {
    switch (event.data) {
        case "start":
            startTimeout();
            break;
        case "stop":
            clearTimeout(timeout);
            self.close();
            break;
    }
});