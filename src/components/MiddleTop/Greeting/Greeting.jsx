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

  async function setRandomGreeting(greetings) {
    const marked = await import("marked");
    const index = Math.floor(Math.random() * greetings.length);
    const greeting = marked.parse(greetings[index], { mangle: false, headerIds: false });

    setGreeting(greeting);
  }

  return <div className="greeting" style={{ "--text-size-scale": settings.textSize }} dangerouslySetInnerHTML={{ __html: greeting }}></div>;
}
