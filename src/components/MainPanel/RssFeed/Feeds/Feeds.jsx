import { useState } from "react";
import * as feedService from "services/feeds";
import { SortableItem, SortableList } from "components/Sortable";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import CreateButton from "components/CreateButton";
import "./feeds.css";
import Feed from "./Feed";

export default function Feeds({ feeds, locale, selectFeedFromList, removeFeed, deactivateFeed, updateFeeds, showForm, hide }) {
  const [activeDragId, setActiveDragId] = useState(null);

  async function refetchFeed(feed, type) {
    feed.fetching = true;
    updateFeeds(feeds, false);

    try {
      const data = await feedService.fetchFeed(feed);

      if (data.message) {
        feed.fetching = false;
        updateFeeds(feeds, false);
        return;
      }

      if (type === "failed") {
        insertFailedFeed(data, feed.index);
      }
      else if (type === "inactive") {
        activateFeed(data);
      }
      updateFeeds(feeds);
    } catch (e) {
      console.log(e);
      feed.fetching = false;
      updateFeeds(feeds, false);
    }
  }

  function insertFailedFeed(feed, index) {
    feeds.failed = feeds.failed.filter(({ url }) => url !== feed.url);
    feeds.active.splice(index, 0, feed);
  }

  function activateFeed(feed) {
    feeds.inactive = feeds.inactive.filter(({ url }) => url !== feed.url);
    feeds.active.push(feed);
  }

  function handleSort(items) {
    if (items) {
      feeds.active = items;
      updateFeeds(feeds);
    }
    setActiveDragId(null);
  }

  function handleDragStart(event) {
    setActiveDragId(event.active.id);
  }

  function renderFeed(feed, index) {
    const component = {
      Component: Feed,
      params: {
        index,
        feed,
        feeds,
        locale,
        updateFeeds,
        selectFeedFromList,
        deactivateFeed,
        removeFeed
      }
    };

    return (
      <SortableItem className={`feed-list-item${feed.id === activeDragId ? " dragging" : ""}`}
        component={component} id={feed.id} key={feed.id} handleTitle={locale.global.drag}/>
    );
  }

  return (
    <div className="rss-feed">
      <div className="container-header feed-list-header">
        <h2 className="container-header-title">{locale.rssFeed.feeds_title}</h2>
        {feeds.active.length > 0 && (
          <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
            <Icon id="cross"/>
          </button>
        )}
      </div>
      <ul className="container-body feed-list-items" data-dropdown-parent>
        <SortableList
          items={feeds.active}
          handleSort={handleSort}
          handleDragStart={handleDragStart}>
          {feeds.active.map((feed, index) => renderFeed(feed, index))}
        </SortableList>
        {feeds.failed.map((feed, index) => (
          <li className={`feed-list-item${feed.fetching ? " fetching" : ""}`} key={feed.url}>
            <div className="feed-list-item-content">
              <div className="feed-list-item-header">
                <div className="feed-list-item-title-container">
                  <h3 className="feed-list-item-title">{feed.title}</h3>
                  <a href={feed.url} className="feed-list-item-url" target="_blank" rel="noreferrer">{feed.url}</a>
                </div>
                <button className="btn icon-btn" onClick={() => removeFeed(index, "failed")} title={locale.global.remove}>
                  <Icon id="trash"/>
                </button>
              </div>
              <div className="feed-list-item-error">
                <span>{locale.rssFeed.fetch_error}</span>
                <button className="btn" onClick={() => refetchFeed(feed, "failed")} disabled={feed.fetching}>{locale.rssFeed.retry}</button>
              </div>
            </div>
          </li>
        ))}
        {feeds.inactive.map((feed, index) => (
          <li className={`feed-list-item${feed.fetching ? " fetching" : ""}`} key={feed.url}>
            <div className="feed-list-item-content">
              <div className="feed-list-item-header">
                {feed.image ? <img src={feed.image} className="feed-list-item-logo" width="40px" height="40px" alt=""/> : null}
                <div className="feed-list-item-title-container">
                  <h3 className="feed-list-item-title inactive">
                    <Icon id="sleep" className="inactive-feed-icon" title={locale.rssFeed.inactive}/>
                    <span>{feed.title}</span>
                  </h3>
                  <a href={feed.url} className="feed-list-item-url" target="_blank" rel="noreferrer">{feed.url}</a>
                </div>
                <Dropdown>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => refetchFeed(feed, "inactive")}>
                    <Icon id="sleep-off"/>
                    <span>{locale.rssFeed.activate}</span>
                  </button>
                  <button className="btn icon-text-btn dropdown-btn" onClick={() => removeFeed(index, "inactive")}>
                    <Icon id="trash"/>
                    <span>{locale.global.remove}</span>
                  </button>
                </Dropdown>
              </div>
              <p>{feed.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <CreateButton style={{ "--expanded-width": "76px" }} onClick={showForm}>{locale.global.add}</CreateButton>
    </div>
  );
}
