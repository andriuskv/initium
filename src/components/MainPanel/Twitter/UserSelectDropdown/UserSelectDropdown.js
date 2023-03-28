import { getUsers, getSelectedUser } from "services/twitter";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./user-select-dropdown.css";

export default function UserSelectDropdown({ selectUser, showTimelines, showAnotherUserForm, logout }) {
  const users = getUsers();
  const selectedUser = getSelectedUser();

  return (
    <Dropdown
      container={{ className: "twitter-header-btn" }}
      body={{ className: "twitter-header-dropdown" }}>
      <div className="dropdown-group">
        {users.map((user, i) => (
          <button className="btn icon-text-btn dropdown-btn twitter-header-dropdown-user"
            onClick={() => selectUser(user, i)} disabled={user.selected} key={i} title={`Switch to ${user.handle}`}>
            <img src={user.profileImage} className="twitter-header-dropdown-user-image" width="48px" height="48px" loading="lazy" alt=""/>
            <div className="twitter-header-dropdown-user-name-handle">
              <div className="twitter-header-dropdown-user-name">{user.name}</div>
              <div className="twitter-header-dropdown-user-handle">{user.handle}</div>
            </div>
            {users.length > 1 && user.selected && (
              <div className="twitter-checkmark twitter-header-dropdown-checkmark"></div>
            )}
          </button>
        ))}
      </div>
      {users.length > 1 ? (
        <button className="btn icon-text-btn dropdown-btn" onClick={showTimelines}>
          <Icon id="list"/>
          <span>Timelines</span>
        </button>
      ) : null}
      <button className="btn icon-text-btn dropdown-btn" onClick={showAnotherUserForm}>
        <Icon id="plus"/>
        <span>Add another account</span>
      </button>
      <button className="btn icon-text-btn dropdown-btn" onClick={logout}>
        <Icon id="logout"/>
        <span>Log out {selectedUser.handle}</span>
      </button>
    </Dropdown>
  );
}
