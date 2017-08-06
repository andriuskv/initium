var timeout = 0;

function startTimeout() {
    var start = Date.now();

    timeout = setTimeout(function() {
        self.postMessage(start);
        startTimeout();
    }, 20);
}

self.addEventListener("message", function(event) {
    switch (event.data) {
        case "start":
            startTimeout();
            break;
        case "stop":
            clearTimeout(timeout);
            break;
    }
});
