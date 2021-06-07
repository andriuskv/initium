import * as feedService from "services/feeds";
import "./feeds.css";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import { SortableItem, SortableList, SortHandle } from "services/sortable";

export default function Feeds({ feeds, feedsToLoad, selectFeedFromList, removeFeed, updateFeeds, showForm, hide }) {
  function enableTitleEdit(feed) {
    feed.updatingTitle = true;
    updateFeeds(feeds, feedsToLoad, false);
  }

  function renameFeed(event, feed) {
    const newTitle = event.target.value;
    let shouldSave = false;

    delete feed.updatingTitle;

    if (newTitle && newTitle !== feed.title) {
      feed.title = newTitle;
      shouldSave = true;
    }
    updateFeeds(feeds, feedsToLoad, shouldSave);
  }

  function removeFailedToFetchFeed(index) {
    feedsToLoad.splice(index, 1);
    updateFeeds(feeds, feedsToLoad);
  }

  async function refetchFeed(feed) {
    feed.fetching = true;
    updateFeeds(feeds, feedsToLoad, false);

    try {
      const data = await feedService.fetchFeed(feed);

      if (data.message) {
        return;
      }
      const failedFeeds = feedsToLoad.filter(({ url }) => url !== feed.url);

      feeds.splice(feed.index, 0, data);
      updateFeeds(feeds, failedFeeds);
    } catch (e) {
      console.log(e);
      feed.fetching = false;
      updateFeeds(feeds, feedsToLoad, false);
    }
  }

  function blurFeedTitleInput(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  function handleSort(feeds) {
    updateFeeds(feeds, feedsToLoad);
  }

  return (
    <div className="rss-feed">
      <div className="feed-list-header">
        <h2 className="feed-list-title">RSS Feeds</h2>
        <button className="btn icon-btn" onClick={() => showForm(true)} title="Add feed">
          <Icon id="plus"/>
        </button>
        {feeds.length > 0 && (
          <button className="btn icon-btn" onClick={hide} title="Hide feeds">
            <Icon id="cross"/>
          </button>
        )}
      </div>
      <SortableList items={feeds} useDragHandle={true} handleSort={handleSort}>
        <ul className="feed-list-items" data-dropdown-parent>
          {feeds.map((feed, index) => (
            <SortableItem key={feed.url} index={index}>
              <li className="feed-list-item" key={feed.url}>
                <div className="feed-list-item-header">
                  {feed.image ? <img src={feed.image} className="feed-list-item-logo" width="40px" height="40px" alt=""/> : null}
                  <div className="feed-list-item-title-container">
                    {feed.updatingTitle ? (
                      <input type="text" className="input feed-list-item-title-input"
                        onBlur={(event) => renameFeed(event, feed)} onKeyUp={blurFeedTitleInput}
                        autoFocus defaultValue={feed.title}/>
                    ) : (
                      <button className="btn text-btn feed-list-item-title" onClick={event => selectFeedFromList(event, index)}>
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
                  <SortHandle>
                    <button className="btn icon-btn feed-list-item-drag-handle">
                      <Icon id="drag"/>
                    </button>
                  </SortHandle>
                  {!feed.updatingTitle && (
                    <Dropdown>
                      <button className="btn icon-text-btn dropdown-btn" onClick={() => enableTitleEdit(feed)}>
                        <Icon id="edit"/>
                        <span>Rename</span>
                      </button>
                      <button className="btn icon-text-btn dropdown-btn" onClick={() => removeFeed(index)}>
                        <Icon id="trash"/>
                        <span>Remove</span>
                      </button>
                    </Dropdown>
                  )}
                </div>
                <p>{feed.description}</p>
                {feed.updated ? <div className="feed-date">Updated on: {feed.updated}</div> : null}
              </li>
            </SortableItem>
          ))}
          {feedsToLoad.map((feed, i) => (
            <li className={`feed-list-item${feed.fetching ? " fetching" : ""}`} key={feed.url}>
              <div className="feed-list-item-content">
                <div className="feed-list-item-header">
                  <div className="feed-list-item-title-container">
                    <h3 className="feed-list-item-title">{feed.title}</h3>
                    <a href={feed.url} className="feed-list-item-url" target="_blank" rel="noreferrer">{feed.url}</a>
                  </div>
                  <button className="btn icon-btn" onClick={() => removeFailedToFetchFeed(i)} title="Remove">
                    <Icon id="trash"/>
                  </button>
                </div>
                <div className="feed-list-item-error">
                  <span>Failed to fetch.</span>
                  <button className="btn" onClick={() => refetchFeed(feed)} disabled={feed.fetching}>Try again</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </SortableList>
    </div>
  );
}
