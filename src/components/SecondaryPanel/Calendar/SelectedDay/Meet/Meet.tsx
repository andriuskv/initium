import type { GoogleReminder } from "types/calendar";
import "./meet.css";

type Props = {
  meet: GoogleReminder["meet"]
}

export default function Meet({ meet }: Props) {
  if (!meet) {
    return null;
  }

  return (
    <div className="reminder-list-item-meet">
      <img src={meet.iconUri} alt="" className="reminder-list-item-meet-icon"/>
      <div className="reminder-list-item-meet-link-container">
        <a href={meet.uri} target="_blank" rel="noreferrer" className="btn reminder-list-item-meet-link">Join with Google Meet</a>
        <span className="reminder-list-item-meet-label">{meet.label}</span>
      </div>
    </div>
  );
}
