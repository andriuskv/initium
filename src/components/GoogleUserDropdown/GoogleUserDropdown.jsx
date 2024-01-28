import Dropdown from "components/Dropdown";
import "./google-user-dropdown.css";

export default function GoogleUserDropdown({ className, user, showCalendarLink, handleSignOut }) {
  return (
    <Dropdown container={className ? { className } : null} toggle={{
      body: <img src={user.photo} className="google-user-dropdown-toggle-image" alt=""/>,
      className: "google-user-dropdown-toggle-btn"
    }} body={{ className: "google-user-dropdown" }}>
      <div className="google-user">
        <img src={user.photo} width="48px" height="48px" className="google-user-image" loading="lazy" alt=""/>
        <div>
          <div className="google-user-name">{user.name}</div>
          <div className="google-user-email">{user.email}</div>
        </div>
      </div>
      <div className="google-user-dropdown-bottom">
        {showCalendarLink ? (
          <a href="https://calendar.google.com" className="btn icon-btn google-user-calendar-link" target="_blank" title="Open Google Calendar">
            <img src="assets/google-product-logos/calendar.png" className="google-user-calendar-logo" width="24px" height="24px" loading="lazy" alt=""></img>
          </a>
        ) : null}
        <button className="btn text-btn google-user-logout-btn" onClick={handleSignOut}>Disconnect</button>
      </div>
    </Dropdown>
  );
}
