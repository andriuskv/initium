import type { GeneralSettings } from "types/settings";
import { useState, useEffect, type CSSProperties } from "react";
import * as chromeStorage from "services/chromeStorage";
import "./greeting.css";

export default function Greeting({ settings }: { settings: GeneralSettings["greeting"]}) {
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

  async function setRandomGreeting(greetings: string[]) {
    const marked = await import("marked");
    const index = Math.floor(Math.random() * greetings.length);
    const greeting = await marked.parse(greetings[index]);

    setGreeting(greeting);
  }

  return (
    <div className="greeting"
      style={{ "--text-size-scale": settings.textSize } as CSSProperties }
      dangerouslySetInnerHTML={{ __html: greeting }}>
    </div>
  );
}
