export class ReminderService {
    getReminders() {
        return new Promise(resolve => {
            chrome.storage.sync.get("reminders", storage => {
                const reminders = storage.reminders || JSON.parse(localStorage.getItem("reminders")) || [];

                resolve(reminders);
            });
        })
    }

    saveReminders(reminders) {
        chrome.storage.sync.set({ reminders });
    }
}
