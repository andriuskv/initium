function updateTitle(hours, minutes, seconds) {
    let title = `${seconds}s | Initium`;

    if (minutes) {
        title = `${minutes}m ${title}`;
    }
    if (hours) {
        title = `${hours}h ${title}`;
    }
    document.title = title;
}

export {
    updateTitle
};
