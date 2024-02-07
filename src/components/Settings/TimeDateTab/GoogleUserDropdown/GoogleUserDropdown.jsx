import Dropdown from "components/Dropdown";
import "./google-user-dropdown.css";

export default function GoogleUserDropdown({ className, user, handleSignOut }) {
  return (
    <Dropdown container={className ? { className } : null} toggle={{
      title: user.name,
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
        <button className="btn text-btn" onClick={handleSignOut} data-dropdown-close>Disconnect</button>
      </div>
    </Dropdown>
  );
}
