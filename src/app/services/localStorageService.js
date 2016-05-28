export class LocalStorageService {
    set(name, content) {
        localStorage.setItem(name, JSON.stringify(content));
    }

    get(item) {
        return JSON.parse(localStorage.getItem(item));
    }

    remove(item) {
        localStorage.removeItem(item);
    }
}
