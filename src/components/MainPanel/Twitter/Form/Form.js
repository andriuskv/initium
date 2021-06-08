import { useState, useEffect } from "react";
import { fetchAccessToken, fetchLoginUrl } from "services/twitter";
import Icon from "components/Icon";
import "./form.css";

export default function Form({ initialLoading, addingAnotherUser, loadContent, hide }) {
  const [loading, setLoading] = useState(initialLoading);
  const [form, setForm] = useState({});
  const [closeButtonVisible, setCloseButtonVisible] = useState(false);

  useEffect(() => {
    if (addingAnotherUser) {
      setCloseButtonVisible(true);
      openLoginPage();
    }
  }, []);

  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  async function authenticateWithPin(pin) {
    setLoading(true);

    const success = await fetchAccessToken(pin);

    if (success) {
      loadContent();
    }
    else {
      setLoading(false);
      setForm({
        pinInputVisible: true,
        message: "Something went wrong. Try again later."
      });
    }
  }

  async function handleFormSubmit(event) {
    const pin = event.target.elements.pin.value;

    event.preventDefault();

    if (pin) {
      authenticateWithPin(pin);
      return;
    }
    openLoginPage();
  }

  async function openLoginPage() {
    const url = await fetchLoginUrl();

    if (url) {
      setForm({ pinInputVisible: true });
      window.open(url, "_blank", "width=1024,height=720");
    }
  }

  if (loading) {
    return <Icon id="twitter" className="main-panel-item-splash-icon animate"/>;
  }
  return (
    <div className="twitter-splash">
      <Icon id="twitter" className="main-panel-item-splash-icon"/>
      <div>
        <form onSubmit={handleFormSubmit} className="twitter-pin-input-container">
          <input type="text" className={`input twitter-pin-input${form.pinInputVisible ? " visible" : ""}`}
            name="pin" placeholder="Enter PIN" autoComplete="off"/>
          <button className="btn">Log in</button>
        </form>
        {form.message && <p>{form.message}</p>}
      </div>
      {closeButtonVisible && (
        <button type="button" className="btn icon-btn twitter-hide-form-btn" onClick={hide} title="Close">
          <Icon id="cross"/>
        </button>
      )}
    </div>
  );
}
