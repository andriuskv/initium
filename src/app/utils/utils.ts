function dispatchCustomEvent(eventName, data = null) {
    const event: CustomEvent = new CustomEvent(eventName, { detail: data });

    window.dispatchEvent(event);
}

function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

function getRandomHslColor() {
    return {
        hue: Math.floor(Math.random() * 360) + 1,
        saturation: 100,
        lightness: 68
    };
}

function getRandomHexColor() {
    const letters = "6789ABCDEF";
    let color = "#";

    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

function padTime(time: number, pad: number | boolean = true) {
    return pad && time < 10 ? `0${time}` : time;
}

function formatTime(time: number) {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor(time / 60 % 60);
    const seconds = time % 60;

    return `${hours ? `${hours}:` : ""}${padTime(minutes, hours)}:${padTime(seconds)}`;
}

export {
    dispatchCustomEvent,
    delay,
    getRandomHslColor,
    getRandomHexColor,
    formatTime
};
