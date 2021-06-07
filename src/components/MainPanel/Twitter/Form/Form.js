import { useState, useEffect } from "react";
import { fetchAccessToken, fetchLoginUrl } from "services/twitter";
import Icon from "components/Icon";
import "./form.css";

export default function Form({ initialLoading, loadContent }) {
  const [loading, setLoading] = useState(initialLoading);
  const [form, setForm] = useState({});

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
    const url = await fetchLoginUrl();

    if (url) {
      setForm({ pinInputVisible: true });
      window.open(url, "_blank", "width=640,height=480");
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
            name="pin" placeholder="Enter PIN"/>
          <button className="btn">Log in</button>
        </form>
        {form.message && <p>{form.message}</p>}
      </div>
    </div>
  );
}
