import type { AppearanceSettings } from "types/settings";
import type { Note, FormType } from "types/stickyNotes";
import { useState, useEffect, lazy, Suspense, type CSSProperties, type MouseEvent } from "react";
import { useNotes } from "contexts/stickyNotes";
import { getSetting } from "services/settings";
import * as focusService from "services/focus";
import "./sticky-notes.css";

const Form = lazy(() => import("./Form"));

export default function StickyNotes() {
  const { notes } = useNotes();
  const [form, setForm] = useState<FormType | null>(null);
  let notesToRender: Note[] | null = null;

  if (notes.length) {
    notesToRender = notes.filter(note => !note.hidden);

    if (form?.readyToShow) {
      notesToRender = notesToRender.filter(note => note.id !== form.id);
    }
  }

  useEffect(() => {
    function handleStickyNoteChange({ detail }: CustomEventInit) {
      if (form) {
        resetTextSelection();
      }

      if (detail.action === "create") {
        setForm(detail);
      }
      else if (detail.action === "edit") {
        const index = notes.findIndex(note => note.id === detail.id);

        setForm({ ...notes[index], index, action: detail.action });
      }
    }

    if (form && !notes.some(note => note.togglingHide)) {
      discardWithAnimation();
    }
    window.addEventListener("sticky-note", handleStickyNoteChange);

    return () => {
      window.removeEventListener("sticky-note", handleStickyNoteChange);
    };
  }, [notes]);

  function handleNoteClick(note: Note, event: MouseEvent) {
    if (event.detail === 2) {
      const index = notes.findIndex(({ id }) => note.id === id);


      setForm({ ...note, index, action: "edit" });
    }
  }

  function handleNoteMouseDown(event: MouseEvent) {
    if (event.detail === 2) {
      const element = event.currentTarget as HTMLElement;
      element.style.userSelect = "none";
    }
  }

  function discardNote(shouldAnimate = true) {
    resetTextSelection();

    if (form?.action === "edit" || !shouldAnimate) {
      focusService.focusSelector("[data-focus-id=stickyNotes]");
      setForm(null);
    }
    else if (shouldAnimate) {
      discardWithAnimation();
    }
  }

  function discardWithAnimation() {
    const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

    if (form) {
      setForm({ ...form, discarding: true });
    }
    setTimeout(() => {
      setForm(null);
    }, 200 * animationSpeed);
  }

  function resetTextSelection() {
    // Remove selected text that might be previously selected by double click.
    window.getSelection()?.removeAllRanges();
  }

  function showForm() {
    if (form) {
      setForm({ ...form, readyToShow: true });
    }
  }

  return (
    <>
      { notesToRender ? (
        <ul className="sticky-notes">
          {notesToRender.map(note => (
            <li className={`sticky-note${note.discarding ? " discarding" : ""}`} style={{ "--x": note.x, "--y": note.y, "--tilt": note.tilt, "--scale": note.scale, "--text-scale": note.textScale, backgroundColor: note.backgroundColor, "--text-color": note.textStyle.string } as CSSProperties} onClick={event => handleNoteClick(note, event)}
              onMouseDown={handleNoteMouseDown} key={note.id}>
              <p className="sticky-note-content" dangerouslySetInnerHTML={{ __html: note.contentDisplayString! }}></p>
            </li>
          ))}
        </ul>
      ) : null}
      {form ? (
        <Suspense fallback={null}>
          <Form initialForm={form} noteCount={notes.length} discardNote={discardNote} showForm={showForm}/>
        </Suspense>
      ) : null}
    </>
  );
}
