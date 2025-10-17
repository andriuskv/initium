import type { FeedTypeName, FeedType } from "types/feed";
import type { PropsWithChildren, MouseEvent, KeyboardEvent, FocusEvent } from "react";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import Link from "components/Link";

type Props = PropsWithChildren & {
  locale: any,
  index: number,
  feed: FeedType,
  updateFeed: (feed: FeedType, type: FeedTypeName, shouldSave?: boolean) => void,
  selectFeedFromList: (event: MouseEvent<HTMLButtonElement>, index: number) => void,
  deactivateFeed: (index: number) => void,
  removeFeed: (index: number, type: string) => void,
}

export default function Feed({ children, index, feed, locale, updateFeed, selectFeedFromList, deactivateFeed, removeFeed }: Props) {
  function enableTitleEdit() {
    updateFeed({
      ...feed,
      updatingTitle: true
    }, "active");
  }

  function renameFeed(event: FocusEvent) {
    const newTitle = (event.target as HTMLInputElement).value;
    const newFeed = {
      ...feed,
      updatingTitle: undefined
    };
    let shouldSave = false;

    if (newTitle && newTitle !== feed.title) {
      newFeed.title = newTitle;
      shouldSave = true;
    }
    updateFeed(newFeed, "active", shouldSave);
  }

  function blurFeedTitleInput(event: KeyboardEvent) {
    if (event.key === "Enter") {
      (event.target as HTMLElement).blur();
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
          <Link href={feed.url} className="feed-list-item-url">{feed.url}</Link>
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
      {feed.message ? <span className="feed-error-message">{locale.rssFeed.fetch_error}</span> : null}
      {feed.updated ? <div className="feed-date">Updated on {feed.updated}</div> : null}
    </>
  );
}
