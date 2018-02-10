export class ReminderService {
    getReminders() {
        return new Promise(resolve => {
            chrome.storage.sync.get("reminders", storage => {
                resolve(storage.reminders || []);
            });
        })
    }

    saveReminders(reminders) {
        chrome.storage.sync.set({ reminders });
    }
}
