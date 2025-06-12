import type { Notification } from "types/notification";
import { useNotification } from "contexts/notification";
import "./notification.css";
import Icon from "components/Icon";
import { useLocalization } from "contexts/localization";

export default function Notification() {
  const locale = useLocalization();
  const { notifications, dismissNotification } = useNotification();

  function handleActionClick(notification: Notification) {
    dismissNotification(notification.id);

    if (notification.action) {
      notification.action();
    }
  }

  if (!notifications.length) {
    return null;
  }
  return (
    <div className="notifications">
      {notifications.map(notification => (
        <div className={`container notification${notification.hiding ? " hiding" : ""}`} key={notification.id}>
          {notification.title ? <div className="container-header notification-top">
            {notification.iconId ? <Icon id={notification.iconId}/>: null}
            {notification.title ? <p className="notification-title">{notification.title}</p>: null}
          </div> : null}
          <div className="container-body notification-body">
            <p className="notification-text">{notification.content}</p>
            <div className="notification-bottom">
              {notification.action ? (
                <button className="btn text-btn" onClick={() => handleActionClick(notification)}>{notification.actionTitle}</button>
              ) : null}
              <button className="btn text-btn" onClick={() => dismissNotification(notification.id)}>{locale.global.dismiss}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
