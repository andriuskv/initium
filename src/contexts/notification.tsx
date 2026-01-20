import type { PropsWithChildren } from "react";
import type { Notification } from "types/notification";
import { createContext, use, useState, useEffect, useRef, useMemo } from "react";
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
  const addTimeoutId = useRef(0);
  const tempNotifs = useRef<Notification[]>([]);

  function showNotification(notification: Notification) {
    notification.id ??= getRandomString();
    notification.duration ??= 8000;
    tempNotifs.current.push(notification);

    addTimeoutId.current = timeout(() => {
      setNotifications(notifications => [...notifications, ...tempNotifs.current]);
      tempNotifs.current.length = 0;
    }, 100, addTimeoutId.current);
    return notification.id;
  }

  useEffect(() => {
    function handleNotification({ detail }: CustomEventInit) {
      showNotification(detail);
    }

    window.addEventListener("notification", handleNotification);

    return () => {
      window.removeEventListener("notification", handleNotification);
    };
  }, [notifications]);

  function dismissNotification(id: string) {
    setNotifications(notifications => notifications.filter(n => n.id !== id));
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
