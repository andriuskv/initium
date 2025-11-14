import type { ChangeEvent } from "react";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { timeout } from "utils";
import * as chromeStorage from "services/chromeStorage";
import "./greeting-editor.css";
import Header from "./Header/Header";

const Toast = lazy(() => import("components/Toast"));

type Props = {
  locale: any,
  hide: () => void
}

export default function GreetingEditor({ locale, hide }: Props) {
  const [textArea, setTextArea] = useState("");
  const [bytes, setBytes] = useState<{ usedFormated: string, maxFormated: string, message?: string } | null>(null);
  const saveTimeoutId = useRef(0);

  async function setByteUsage() {
    const { usedFormated, maxFormated } = await chromeStorage.getBytesInUse("greetings");

    setBytes({ usedFormated, maxFormated });
  }

  useEffect(() => {
    async function init() {
      const greetings = await chromeStorage.get("greetings") as string[];

      if (greetings?.length) {
        setTextArea(greetings.join("\n"));
      }
      setByteUsage();
    }

    init();
  }, []);

  function dismissMessage() {
    if (bytes) {
      setBytes({
        usedFormated: bytes.usedFormated,
        maxFormated: bytes.maxFormated
      });
    }
  }

  function handleTextareaChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setTextArea(event.target.value);
    saveTimeoutId.current = timeout(() => {
      saveGreetings(event.target.value);
    }, 400, saveTimeoutId.current);
  }

  async function saveGreetings(text: string) {
    const data = await chromeStorage.set({
      greetings: text.split("\n").filter(line => line).map(line => line.trim())
    }, { warnSize: true });

    if (data?.usedRatio !== 1) {
      setByteUsage();
    }
    else if (bytes) {
      setBytes({
        ...bytes,
        message: data.message
      });
    }
  }

  return (
    <div className="greeting-editor">
      <Header locale={locale} bytes={bytes} hide={hide}/>
      {bytes?.message && (
        <Suspense fallback={null}>
          <Toast locale={locale} message={bytes.message} position="bottom" dismiss={dismissMessage}/>
        </Suspense>
      )}
      <textarea className="container-body textarea greeting-editor-textarea" value={textArea} onChange={handleTextareaChange}></textarea>
    </div>
  );
}
