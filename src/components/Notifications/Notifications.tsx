
import { useNotification } from "contexts/notification";
import { useSettings } from "contexts/settings";
import { useLocalization } from "contexts/localization";
import "./notifications.css";
import Notification from "./Notification/Notification";

export default function Notifications() {
  const { settings } = useSettings();
  const locale = useLocalization();
  const { notifications } = useNotification();

  if (!notifications.length) {
    return null;
  }
  return (
    <div className={`notifications ${settings.general.notifPosition}`}>
      {notifications.map(notification => (
        <Notification notification={notification} locale={locale} key={notification.id} />
      ))}
    </div>
  );
}
