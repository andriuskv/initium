import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./header-dropdown.css";

export default function HeaderDropdown({ user, showReminderList, handleUserSignOut }) {
  return (
    <Dropdown container={{ className: "calendar-header-dropdown-container" }}
      toggle={{
        body: user ? (
          <>
            <Icon id="vertical-dots"/>
            <img src={user.photo} className="calendar-header-dropdown-toggle-image" alt=""/>
          </>
        ) : <Icon id="vertical-dots"/>,
        className: "calendar-header-dropdown-toggle-btn"
      }}
      body={{ className: "calendar-header-dropdown" }}>
      <div className="dropdown-group">
        <button className="btn text-btn dropdown-btn" onClick={showReminderList}>Reminders</button>
      </div>
      {user ? (
        <div className="dropdown-group">
          <div className="calendar-header-dropdown-user">
            <img src={user.photo} width="48px" height="48px" className="calendar-header-dropdown-user-image" loading="lazy" alt=""/>
            <div>
              <div className="calendar-header-dropdown-user-name">{user.name}</div>
              <div className="calendar-header-dropdown-user-email">{user.email}</div>
            </div>
          </div>
          <div className="calendar-header-dropdown-bottom">
            <a href="https://calendar.google.com" className="btn icon-btn calendar-header-dropdown-calendar-link" target="_blank" title="Open Google Calendar">
              <img src="assets/google-product-logos/calendar.png" className="calendar-header-dropdown-calendar-logo" width="24px" height="24px" loading="lazy" alt=""></img>
            </a>
            <button className="btn text-btn calendar-header-dropdown-user-logout-btn" onClick={handleUserSignOut}>Disconnect</button>
          </div>
        </div>
      ) : null}
    </Dropdown>
  );
}
