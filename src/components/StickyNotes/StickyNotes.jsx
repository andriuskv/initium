import { useState, useEffect, lazy, Suspense } from "react";
import { useNotes } from "contexts/stickyNotes";
import "./sticky-notes.css";

const Form = lazy(() => import("./Form"));

export default function StickyNotes() {
  const { notes, createNote } = useNotes();
  const [form, setForm] = useState(null);

  useEffect(() => {
    window.addEventListener("sticky-note", handleStickyNoteChange);

    return () => {
      window.removeEventListener("sticky-note", handleStickyNoteChange);
    };
  }, [notes]);

  function handleStickyNoteChange({ detail }) {
    if (detail.action === "create") {
      setForm(detail);
    }
    else if (detail.action === "edit") {
      const index = notes.findIndex(note => note.id === detail.id);

      setForm({ ...notes[index], index, action: detail.action });
    }
  }

  function discardNote() {
    setForm(null);
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
      <ul>
        {notesToRender.map(note => (
          <li className="sticky-note" style={{ "--x": note.x, "--y": note.y, "--tilt": note.tilt, backgroundColor: note.color }}
            key={note.id}>
            {note.title ? <p className="sticky-note-title">{note.title}</p> : null}
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
          <Form initialForm={form} noteCount={notes.length} createNote={createNote} discardNote={discardNote} showForm={showForm}/>
        </Suspense>
      ) : null}
    </>
  );
}
