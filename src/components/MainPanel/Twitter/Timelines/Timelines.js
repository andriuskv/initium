import { getUsers } from "services/twitter";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./timelines.css";

export default function Timelines({ addTimeline, removeTimeline, hide }) {
  const users = getUsers();
  const activeTimelineCount = users.reduce((total, user) => {
    if (user.active) {
      total += 1;
    }
    return total;
  }, 0);

  return (
    <Modal className="twitter-timelines" hide={hide}>
      <h3 className="twitter-timelines-title">Timelines</h3>
      <ul className="twitter-timelines-items">
        {users.map(user => (
          <li className="twitter-timelines-item" key={user.handle}>
            <button className="btn icon-text-btn dropdown-btn twitter-timelines-item-btn"
              onClick={() => addTimeline(user)} disabled={user.active || activeTimelineCount >= 2}
              title={user.active || activeTimelineCount >= 2 ? "" : "Add a second timeline"}>
              <img src={user.profileImage} className="twitter-timelines-user-image" width="48px" height="48px" alt=""/>
              <div>
                <div>{user.name}</div>
                <div className="twitter-timelines-user-handle">{user.handle}</div>
              </div>
              {user.active && (
                <div className="twitter-checkmark twitter-timelines-checkmark"></div>
              )}
            </button>
            {user.active && activeTimelineCount >= 2 ? (
              <button className="btn icon-btn alt-icon-btn" onClick={() => removeTimeline(user.handle)} title="Remove timeline">
                <Icon id="trash"/>
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="twitter-timelines-bottom">
        <div className="twitter-timelines-notice">
          <Icon id="info"/>
          <p>Two timelines can be active at a time.</p>
        </div>
        <button className="btn text-btn" onClick={hide}>Close</button>
      </div>
    </Modal>
  );
}
