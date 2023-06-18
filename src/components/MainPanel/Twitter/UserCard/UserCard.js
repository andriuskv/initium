import { useState, useLayoutEffect, useRef } from "react";
import Icon from "components/Icon";
import "./user-card.css";

export default function UserCard({ userCard, handlePointerEnter, handlePointerLeave }) {
  const [state, setState] = useState({});
  const userCardRef = useRef(null);

  useLayoutEffect(() => {
    if (userCard.reveal) {
      const offset = {};
      let onTop = false;
      let onRight = false;

      if (userCard.data) {
        const { handle, container } = userCard.data;
        const rect = userCardRef.current.getBoundingClientRect();
        const height = rect.height;
        const width = rect.width;

        if (handle.bottom + height > container.height && handle.top - height > container.scrollTop) {
          offset.bottom = handle.top - height;
          onTop = true;
        }

        if (handle.left + width > container.width) {
          offset.right = handle.right - width;
          onRight = true;
        }
      }
      setState({ offset, onTop, onRight, visible: true });
    }
    else {
      setState({});
    }
  }, [userCard.reveal]);

  function getStyles() {
    return {
      top: `${state.onTop ? state.offset.bottom : userCard.data.handle.bottom}px`,
      left: `${state.onRight ? state.offset.right : userCard.data.handle.left}px`
    };
  }

  return (
    <div className={`container twitter-user-card${state.visible ? " visible" : ""}`} style={getStyles()}
      onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave} ref={userCardRef}>
      <div className="twitter-user-card-top">
        <a href={userCard.url} target="_blank" rel="noreferrer">
          {userCard.suspended ? <div className="tweet-user-image-placeholder"></div>: (
            <img src={userCard.profileImageUrl} className="tweet-user-image" width="64px" height="64px" loading="lazy" alt=""/>
          )}
        </a>
        {userCard.suspended ? null : (
          <span className="twitter-user-card-follow-status">{userCard.following ? "Following" : "Not following"}</span>
        )}
      </div>
      <a href={userCard.url} className="tweet-user-card-info" target="_blank" rel="noreferrer">
        <span className="twitter-user-card-name-container">
          <span className="twitter-user-card-name">{userCard.name}</span>
          {userCard.verified ? <Icon id="verified" className="tweet-verified-icon"/> : null}
        </span>
        <span className="tweet-user-handle">
          <span>{userCard.handle}</span>
        </span>
      </a>
      <p className="twitter-user-card-description" dangerouslySetInnerHTML={{ __html: userCard.description }}></p>
      {userCard.suspended ? null : (
        <div className="twitter-user-card-bottom">
          <span className="twitter-user-card-info-item">
            <span className="twitter-user-card-info-item-value">{userCard.followingCount}</span>
            <span className="twitter-user-card-info-item-name">Following</span>
          </span>
          <span>
            <span className="twitter-user-card-info-item-value">{userCard.followerCount}</span>
            <span className="twitter-user-card-info-item-name">Followers</span>
          </span>
        </div>
      )}
    </div>
  );
}
