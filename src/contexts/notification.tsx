import type { PropsWithChildren } from "react";
import type { AppearanceSettings } from "types/settings";
import type { Notification } from "types/notification";
import { createContext, use, useState, useEffect, useRef, useMemo } from "react";
import { getSetting } from "services/settings";
import { getRandomString, timeout } from "utils";

type NotificationsContextType = {
  notifications: Notification[],
  showNotification: (notification: Notification) => string,
  dismissNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationsContextType>({} as NotificationsContextType);

function NotificationProvider({ children }: PropsWithChildren) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const memoizedValue = useMemo<NotificationsContextType>(() => {
    return {
      notifications,
      showNotification,
      dismissNotification
    };
  }, [notifications]);
  const dismissTimeoutId = useRef(0);
  const addTimeoutId = useRef(0);
  const tempNotifs = useRef<Notification[]>([]);

  useEffect(() => {
    function handleNotification({ detail }: CustomEvent) {
      showNotification(detail);
    }

    clearTimeout(dismissTimeoutId.current);

    if (notifications.length) {
      const duration = notifications[0].duration || 8;

      dismissTimeoutId.current = window.setTimeout(() => {
        hide(0);
      }, duration * 1000);
    }
    window.addEventListener("notification", handleNotification);

    return () => {
      window.removeEventListener("notification", handleNotification);
    };
  }, [notifications]);

  function showNotification(notification: Notification) {
    notification.id ??= getRandomString();
    tempNotifs.current.push(notification);

    addTimeoutId.current = timeout(() => {
      const newNotifications = [...notifications, ...tempNotifs.current];
      const end = newNotifications.length;
      const start = end - 10 < 0 ? 0 : end - 10;
      tempNotifs.current.length = 0;

      setNotifications(newNotifications.slice(start, end));
    }, 100, addTimeoutId.current);
    return notification.id;
  }

  function dismissNotification(id: string) {
    const index = notifications.findIndex(n => n.id === id);

    hide(index);
  }

  function hide(index: number) {
    const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

    setNotifications(notifications.with(index, {
      ...notifications[index],
      hiding: true
    }));

    setTimeout(() => {
      setNotifications(notifications.toSpliced(index, 1));
    }, 200 * animationSpeed);
  }

  return <NotificationContext value={memoizedValue}>{children}</NotificationContext>;
}

function useNotification() {
  return use(NotificationContext);
}

export {
  NotificationProvider,
  useNotification
};
