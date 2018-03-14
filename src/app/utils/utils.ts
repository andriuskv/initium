function dispatchCustomEvent(eventName, data = null) {
    const event: CustomEvent = new CustomEvent(eventName, { detail: data });

    window.dispatchEvent(event);
}

function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

export {
    dispatchCustomEvent,
    delay
};
