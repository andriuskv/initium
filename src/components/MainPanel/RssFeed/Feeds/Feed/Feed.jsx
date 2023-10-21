import Icon from "components/Icon";
import Dropdown from "components/Dropdown";

export default function Feed({ children, index, feed, feeds, locale, updateFeeds, selectFeedFromList, deactivateFeed, removeFeed }) {
  function enableTitleEdit() {
    feed.updatingTitle = true;
    updateFeeds(feeds, false);
  }

  function renameFeed(event) {
    const newTitle = event.target.value;
    let shouldSave = false;

    delete feed.updatingTitle;

    if (newTitle && newTitle !== feed.title) {
      feed.title = newTitle;
      shouldSave = true;
    }
    updateFeeds(feeds, shouldSave);
  }

  function blurFeedTitleInput(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  return (
    <>
      <div className="feed-list-item-header">
        {feed.image ? <img src={feed.image} className="feed-list-item-logo" width="40px" height="40px" alt=""/> : null}
        <div className="feed-list-item-title-container">
          {feed.updatingTitle ? (
            <input type="text" className="input feed-list-item-title-input"
              onBlur={renameFeed} onKeyDown={e => e.stopPropagation()} onKeyUp={blurFeedTitleInput}
              autoFocus defaultValue={feed.title}/>
          ) : (
            <button className="feed-list-item-title" onClick={event => selectFeedFromList(event, index)}>
              {feed.newEntryCount > 0 && (
                <div className="feed-new-entry-count-container" data-entry-count>
                  <div className="feed-new-entry-count">{feed.newEntryCount}</div>
                </div>
              )}
              <span>{feed.title}</span>
            </button>
          )}
          <a href={feed.url} className="feed-list-item-url" target="_blank" rel="noreferrer">{feed.url}</a>
        </div>
        {children}
        {!feed.updatingTitle && (
          <Dropdown>
            <button className="btn icon-text-btn dropdown-btn" onClick={enableTitleEdit}>
              <Icon id="edit"/>
              <span>{locale.global.rename}</span>
            </button>
            <button className="btn icon-text-btn dropdown-btn" onClick={() => deactivateFeed(index)}>
              <Icon id="sleep"/>
              <span>{locale.rssFeed.deactive}</span>
            </button>
            <button className="btn icon-text-btn dropdown-btn" onClick={() => removeFeed(index, "active")}>
              <Icon id="trash"/>
              <span>{locale.global.remove}</span>
            </button>
          </Dropdown>
        )}
      </div>
      <p>{feed.description}</p>
      {feed.updated ? <div className="feed-date">Updated on {feed.updated}</div> : null}
    </>
  );
}
