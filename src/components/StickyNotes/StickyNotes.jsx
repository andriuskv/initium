import { useState, useEffect, lazy, Suspense } from "react";
import { useNotes } from "contexts/stickyNotes";
import { getSetting } from "services/settings";
import "./sticky-notes.css";

const Form = lazy(() => import("./Form"));

export default function StickyNotes({ locale }) {
  const { notes, createNote } = useNotes();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (form) {
      discardWithAnimation();
    }
    window.addEventListener("sticky-note", handleStickyNoteChange);

    return () => {
      window.removeEventListener("sticky-note", handleStickyNoteChange);
    };
  }, [notes]);

  function handleStickyNoteChange({ detail }) {
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

  function handleNoteClick(note, event) {
    if (event.detail === 2) {
      const index = notes.findIndex(({ id }) => note.id === id);
      setForm({ ...note, index, action: "edit" });
    }
  }

  function handleNoteMouseDown(event) {
    if (event.detail === 2) {
      event.currentTarget.style.userSelect = "none";
    }
  }

  function discardNote(shouldAnimate = true) {
    resetTextSelection();

    if (form.action === "edit" || !shouldAnimate) {
      const element = document.querySelector("[data-focus-id=stickyNotes]");

      if (element) {
        element.focus();
      }
      setForm(null);
    }
    else if (shouldAnimate) {
      discardWithAnimation();
    }
  }

  function discardWithAnimation() {
    const { animationSpeed } = getSetting("appearance");

    setForm({ ...form, discarding: true });

    setTimeout(() => {
      setForm(null);
    }, 200 * animationSpeed);
  }

  function resetTextSelection() {
    // Remove selected text that might be previously selected by double click.
    window.getSelection()?.removeAllRanges();
  }

  function showForm() {
    setForm({ ...form, readyToShow: true });
  }

  function renderNotes() {
    if (!notes.length) {
      return null;
    }
    let notesToRender = notes;

    if (form?.readyToShow) {
      notesToRender = notes.filter(note => note.id !== form.id);
    }
    return (
      <ul className="sticky-notes">
        {notesToRender.map(note => (
          <li className={`sticky-note${note.discarding ? " discarding" : ""}`} style={{ "--x": note.x, "--y": note.y, "--tilt": note.tilt, "--scale": note.scale, "--text-scale": note.textScale, backgroundColor: note.backgroundColor, "--text-color": note.textStyle.string }} onClick={event => handleNoteClick(note, event)}
            onMouseDown={handleNoteMouseDown}
            key={note.id}>
            {note.title ? <p className="sticky-note-content sticky-note-title">{note.title}</p> : null}
            {note.content ? <p className="sticky-note-content">{note.content}</p> : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {renderNotes()}
      {form ? (
        <Suspense fallback={null}>
          <Form initialForm={form} noteCount={notes.length} locale={locale}
            createNote={createNote} discardNote={discardNote} showForm={showForm}/>
        </Suspense>
      ) : null}
    </>
  );
}
