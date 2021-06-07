import { useState } from "react";
import * as feedService from "services/feeds";
import Icon from "components/Icon";
import "./form.css";

export default function Form({ feeds, feedsToLoad, addFeed, hide }) {
  const [form, setForm] = useState({
    backButtonVisible: feeds.length > 0 || feedsToLoad.length > 0
  });

  async function handleFormSubmit(event) {
    const { elements } = event.target;
    const title = elements.title.value;
    const url = elements.url.value;

    event.preventDefault();

    if (feeds.some(feed => feed.url === url)) {
      setForm({ ...form, message: "Feed already exists." });
      return;
    }
    delete form.message;
    setForm({ ...form, fetching: true });

    try {
      const data = await feedService.fetchFeed({ url, title });

      if (data.message) {
        setForm({ ...form, message: data.message });
      }
      else {
        addFeed(data);
      }
    }
    catch (e) {
      console.log(e);
      setForm({ ...form, message: e.message });
    }
  }

  return (
    <form className="feed-form" onSubmit={handleFormSubmit}>
      <Icon id="rss" className="main-panel-item-splash-icon"/>
      <h3 className="feed-form-title">Add new feed</h3>
      <input type="text" className="input feed-form-input" name="title" placeholder="Title" autoComplete="off"/>
      <input type="text" className="input feed-form-input" name="url" placeholder="URL" required/>
      <div className="feed-add-btn-container">
        {form.message && <div className="feed-message">{form.message}</div>}
        <button className="btn" disabled={form.fetching}>{form.fetching ? "Adding..." : "Add"}</button>
      </div>
      {form.backButtonVisible && (
        <button type="button" className="btn icon-btn feed-form-hide-btn" onClick={hide} title="Back to feeds">
          <Icon id="cross"/>
        </button>
      )}
    </form>
  );
}
