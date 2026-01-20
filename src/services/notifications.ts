import type { Announcement } from "types/announcement";
import type { Notification as NotificationType } from "types/notification";
import { getLocalStorageItem } from "utils";

function openTipLink() {
  chrome.tabs.create({ url: process.env.DONATE_LINK_A });
}

const actions = {
  tip: () => openTipLink()
};

async function fetchAnnouncements() {
  const json = await fetch(`${process.env.SERVER_URL}/messages`).then(res => res.json());

  if (!json.messages) {
    return [];
  }
  const time = Number(localStorage.getItem("first"));
  const currentDate = Date.now();
  let localAnnouncements = (getLocalStorageItem<Announcement[]>("announcements") || [])
    .filter(a => a.expires > currentDate);
  const newMessages = (json.messages as Announcement[])
    .filter(m => !localAnnouncements.some((l => l.id === m.id)));
  const newNotifications: NotificationType[] = [];

  for (const message of newMessages) {
    const age = message.age || 0;

    if (age > currentDate - time) {
      continue;
    }
    const notification: NotificationType = {
      id: message.id,
      iconId: message.iconId,
      type: message.type,
      titleId: message.titleId,
      contentId: message.contentId,
      actionTitleId: message.actionTitleId,
      title: message.title || "",
      content: message.content || "",
      duration: message.duration
    };

    if (message.actionId) {
      notification.action = actions[message.actionId as keyof typeof actions];
    }

    newNotifications.push(notification);
    localAnnouncements.push({
      ...message,
      date: Date.now(),
    });
  }
  localStorage.setItem("announcements", JSON.stringify(localAnnouncements));
  return newNotifications;
}

export {
  fetchAnnouncements
};
