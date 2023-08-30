import Modal from "components/Modal";
import "./form.css";

export default function Form({ form, updateSite, hide }) {
  function handleFormSubmit(event) {
    const { elements } = event.target;
    const url = /^https?:\/\//.test(elements.url.value) ? elements.url.value : `https://${elements.url.value}`;
    const title = elements.title.value;

    event.preventDefault();

    if (form.updating) {
      updateSite({
        url,
        title: title || form.title
      }, "update");
    }
    else {
      updateSite({
        url,
        title: title || url
      }, "add");
    }
    hide();
  }

  return (
    <Modal className="top-sites-form" transparent hide={hide}>
      <form onSubmit={handleFormSubmit}>
        <h3 className="modal-title modal-title-center">{form.updating ? "Edit" : "Add"} site</h3>
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
        <div className="modal-actions">
          <button type="button" className="btn text-btn" onClick={hide}>Cancel</button>
          <button className="btn">{form.updating ? "Edit" : "Add"}</button>
        </div>
      </form>
    </Modal>
  );
}
