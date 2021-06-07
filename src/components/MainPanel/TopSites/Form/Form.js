import "./form.css";
import { getRandomString } from "utils";

export default function Form({ form, sites, updateSites, hide }) {
  function handleFormSubmit(event) {
    const { elements } = event.target;
    const url = /^https?:\/\//.test(elements.url.value) ? elements.url.value : `https://${elements.url.value}`;
    const title = elements.title.value;

    event.preventDefault();

    if (form.updating) {
      sites[form.index] = {
        ...sites[form.index],
        url,
        title: title || form.title
      };
    }
    else {
      sites.push({
        url,
        id: getRandomString(4),
        iconUrl: `chrome://favicon/size/16@2x/${url}`,
        title: title || url
      });
    }
    updateSites(sites);
    hide();
  }

  return (
    <form className="container top-sites-form" onSubmit={handleFormSubmit}>
      <h3 className="top-sites-form-title">{form.updating ? "Edit" : "Add"} site</h3>
      <div className="top-sites-form-content">
        <label className="top-sites-form-label">
          <div className="top-sites-form-input-title">Title</div>
          <input type="text" className="input top-sites-form-input"
            defaultValue={form.title} placeholder="Google"
            name="title" autoComplete="off"/>
        </label>
        <label className="top-sites-form-label">
          <div className="top-sites-form-input-title">URL</div>
          <input type="text" className="input top-sites-form-input"
            defaultValue={form.url} placeholder="https://google.com"
            name="url" autoComplete="off" required/>
        </label>
      </div>
      <div className="top-sites-form-buttons">
        <button type="button" className="btn text-btn top-sites-form-cancel-btn" onClick={hide}>Cancel</button>
        <button className="btn">{form.updating ? "Edit" : "Add"}</button>
      </div>
    </form>
  );
}
