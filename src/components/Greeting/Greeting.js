import { useState, useEffect } from "react";
import * as chromeStorage from "services/chromeStorage";
import "./greeting.css";

export default function Greeting({ settings = {} }) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const greetings = await chromeStorage.get("greetings");

    if (greetings?.length) {
      setRandomGreeting(greetings);
    }
    else if (greeting) {
      setGreeting("");
    }

    chromeStorage.subscribeToChanges(({ greetings }) => {
      if (!greetings) {
        return;
      }

      if (greetings.newValue) {
        setRandomGreeting(greetings.newValue);
      }
      else {
        setGreeting("");
      }
    });
  }

  function setRandomGreeting(greetings) {
    const index = Math.floor(Math.random() * greetings.length);
    setGreeting(greetings[index]);
  }

  function getStyles() {
    const styles = {
      "--text-size": `${settings.textSize || 18}px`
    };

    if (settings.useBoldText) {
      styles.fontWeight = "bold";
    }
    return styles;
  }

  return (
    <div className="greeting" style={getStyles()}>
      <p dangerouslySetInnerHTML={{ __html: greeting }}></p>
    </div>
  );
}
