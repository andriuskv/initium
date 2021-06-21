import { useState, useEffect, lazy, Suspense } from "react";
import * as chromeStorage from "services/chromeStorage";
import "./greeting.css";

const Editor = lazy(() => import("./Editor"));

export default function Greeting({ settings = {}, editorVisible, hideEditor }) {
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
  }

  function setRandomGreeting(greetings) {
    const index = Math.floor(Math.random() * greetings.length);
    setGreeting(greetings[index]);
  }

  function hide() {
    hideEditor();
    init();
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

  if (editorVisible) {
    return (
      <Suspense fallback={null}>
        <Editor hide={hide}></Editor>
      </Suspense>
    );
  }
  return (
    <div className="greeting" style={getStyles()}>
      <p dangerouslySetInnerHTML={{ __html: greeting }}></p>
    </div>
  );
}
