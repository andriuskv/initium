import { hsl } from "color-convert";

function dispatchCustomEvent(eventName, data = null) {
    const event: CustomEvent = new CustomEvent(eventName, { detail: data });

    window.dispatchEvent(event);
}

function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

function hslToHex({ hue, saturation, lightness }) {
    return hsl.hex(hue, saturation, lightness);
}

function getRandomHslColor() {
    return {
        hue: Math.floor(Math.random() * 360) + 1,
        saturation: 100,
        lightness: 68
    };
}

function getRandomHexColor() {
    return `#${hslToHex(getRandomHslColor())}`;
}

export {
    dispatchCustomEvent,
    delay,
    getRandomHslColor,
    getRandomHexColor
};
