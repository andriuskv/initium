import type { Notification as NotificationType } from "types/notification";
import type { AppearanceSettings } from "types/settings";
import { useNotification } from "contexts/notification";
import Icon from "components/Icon";
import { useEffect, useState } from "react";
import useWorker from "hooks/useWorker";
import { getSetting } from "services/settings";

export default function Notification({ notification, locale }: { notification: NotificationType, locale: any }) {
  const { dismissNotification } = useNotification();
  const { initWorker, destroyWorker } = useWorker(handleMessage);
  const [hiding, setHiding] = useState(false);
  const [left, setLeft] = useState(notification.duration!);

  function hide() {
    const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

    setHiding(true);

    setTimeout(() => {
      dismissNotification(notification.id);
    }, 200 * animationSpeed);
  }

  function handleMessage({ data }: { data: { id: string; duration: number } }) {
    if (data.duration >= 0) {
      setLeft(data.duration);
    }
    else {
      hide();
    }
  }

  useEffect(() => {
    initWorker({ id: notification.id, duration: notification.duration, interval: 200 });

    return () => {
      destroyWorker(notification.id);
    };
  }, []);

  function handleActionClick(notification: NotificationType) {
    hide();

    if (notification.action) {
      notification.action();
    }
  }

  const title = notification.titleId ? locale.notification[notification.titleId] : notification.title;
  const content = notification.contentId ? locale.notification[notification.contentId] : notification.content;
  const actionTitle = notification.actionTitleId ? locale.notification[notification.actionTitleId] : notification.actionTitle;

  return (
    <div className={`container notification${hiding ? " hiding" : ""}`}>
      {title ? (
        <div className="container-header notification-top">
          {notification.iconId ? <Icon id={notification.iconId} /> : null}
          {title ? <p className="notification-title">{title}</p> : null}
          <div className="notification-duration-bar">
            <div className="notification-duration-bar-fill" style={{ transform: `scaleX(${left / notification.duration!})` }}></div>
          </div>
        </div>
      ) : null}
      <div className="container-body notification-body">
        <p className="notification-text">{content}</p>
        <div className="notification-bottom">
          {notification.action ? (
            <button className="btn text-btn" onClick={() => handleActionClick(notification)}>{actionTitle}</button>
          ) : null}
          <button className="btn text-btn" onClick={() => hide()}>{notification.dismissTitle || locale.global.dismiss}</button>
        </div>
      </div>
    </div>
  );
};
