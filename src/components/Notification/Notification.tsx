import type { Notification } from "types/notification";
import { useNotification } from "contexts/notification";
import "./notification.css";
import Icon from "components/Icon";

export default function Notification() {
  const { notifications, dismissNotification } = useNotification();

  function handleActionClick(notification: Notification) {
    dismissNotification(notification.id);
    notification.action();
  }

  if (!notifications.length) {
    return null;
  }
  return (
    <div className="notifications">
      {notifications.map(notification => (
        <div className={`container notification${notification.hiding ? " hiding" : ""}`} key={notification.id}>
          {notification.title ? <div className="notification-top">
            {notification.iconId ? <Icon id={notification.iconId}/>: null}
            {notification.title ? <p className="notification-title">{notification.title}</p>: null}
          </div> : null}
          <p className="notification-content">{notification.content}</p>
          <div className="notification-bottom">
            {notification.action ? (
              <button className="btn text-btn" onClick={() => handleActionClick(notification)}>{notification.actionTitle}</button>
            ) : null}
            <button className="btn text-btn" onClick={() => dismissNotification(notification.id)}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
}
