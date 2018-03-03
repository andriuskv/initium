function dispatchCustomEvent(eventName, data = null) {
    const event: CustomEvent = new CustomEvent(eventName, { detail: data });

    window.dispatchEvent(event);
}

export {
    dispatchCustomEvent
};
