import { useRef } from "react";
import ToTop from "components/ToTop";
import Icon from "components/Icon";
import "./entries.css";

export default function Entries({ navigation, feeds, selectFeed, previousShift, nextShift, showFeedList, markEntryAsRead, expandEntry }) {
  const containerRef = useRef(0);
  const { activeIndex, shift, animateLeft, animateRight, VISIBLE_ITEM_COUNT } = navigation;

  function handleFeedSelection(event, index) {
    selectFeed(event.target, index, containerRef.current);
  }

  function getEntryDescription(description) {
    const div = document.createElement("div");

    div.innerHTML = description;

    for (const link of div.querySelectorAll("a")) {
      link.setAttribute("target", "_blank");
    }
    return div.innerHTML;
  }

  return (
    <div className="rss-feed">
      <div className="main-panel-item-header">
        {feeds.active.length > VISIBLE_ITEM_COUNT && (
          <button className={`btn icon-btn main-panel-item-header-btn feed-shift-btn${animateLeft ? " active": ""}`}
            onClick={previousShift} disabled={shift <= 0}>
            <Icon id="chevron-left"/>
          </button>
        )}
        <ul className="main-panel-item-header-items">
          {feeds.active.map((feed, i) => (
            <li className={`main-panel-item-header-item${activeIndex === i ? " active" : ""}${i < shift || i >= shift + VISIBLE_ITEM_COUNT ? " hidden" : ""}`} key={feed.url}>
              <button className="btn icon-text-btn main-panel-item-header-item-select-btn feed-select-btn"
                onClick={event => handleFeedSelection(event, i)}>
                {feed.newEntryCount > 0 && (
                  <div className="feed-new-entry-count-container" data-entry-count>
                    <div className="feed-new-entry-count">{feed.newEntryCount}</div>
                  </div>
                )}
                <span className="main-panel-item-header-item-title">{feed.title}</span>
              </button>
            </li>
          ))}
        </ul>
        {feeds.active.length > VISIBLE_ITEM_COUNT && (
          <button className={`btn icon-btn main-panel-item-header-btn feed-shift-btn${animateRight ? " active": ""}`}
            onClick={nextShift} disabled={shift + VISIBLE_ITEM_COUNT >= feeds.active.length}>
            <Icon id="chevron-right"/>
          </button>
        )}
        <div className="main-panel-item-header-separator"></div>
        <button className={`btn icon-btn main-panel-item-header-btn feed-list-btn${feeds.failed.length ? " indicator" : ""}`} onClick={showFeedList} title="Show feeds">
          <Icon id="menu"/>
        </button>
      </div>
      <ul className="feed-entries" ref={containerRef}>
        {feeds.active[activeIndex].entries.map(entry => (
          <li className="feed-entry" onClick={() => markEntryAsRead(entry)} key={entry.id}>
            <div className="feed-entry-title">
              {entry.newEntry && <span className="new-entry-indicator">New</span>}
              <span>
                <a href={entry.link} className="feed-entry-link" target="_blank" rel="noreferrer">{entry.title}</a>
              </span>
            </div>
            <div className={`feed-entry-description-container${entry.truncated ? " truncated" : ""}`}>
              {entry.thumbnail ? <img src={entry.thumbnail} className="feed-entry-thumbnail" height="90px" loading="lazy" alt=""/> : null}
              {entry.description ? (
                <p className="feed-entry-description" dangerouslySetInnerHTML={{ __html: getEntryDescription(entry.description) }}></p>
              ) : null}
            </div>
            <button className="btn text-btn feed-entry-expand-btn" onClick={() => expandEntry(entry)}>Show More</button>
            {entry.date ? <div className="feed-date">Posted on: {entry.date}</div> : null}
          </li>
        ))}
      </ul>
      <ToTop/>
    </div>
  );
}
